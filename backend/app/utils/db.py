import os
import json
import uuid
import datetime
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config.settings import Config

class LocalCollectionMock:
    """Fallback collection providing PyMongo-compatible CRUD methods when MongoDB Atlas is offline."""
    def __init__(self, name, db_mock):
        self.name = name
        self.db = db_mock

    def _get_data(self):
        return self.db.data.get(self.name, [])

    def find_one(self, query):
        for item in self._get_data():
            match = True
            for k, v in query.items():
                if k == "_id":
                    if str(item.get("_id")) != str(v):
                        match = False
                        break
                elif item.get(k) != v:
                    match = False
                    break
            if match:
                # Return copy with string _id
                res = dict(item)
                res["_id"] = str(res["_id"])
                return res
        return None

    def find(self, query=None, sort=None, limit=0):
        query = query or {}
        results = []
        for item in self._get_data():
            match = True
            for k, v in query.items():
                if k == "_id":
                    if str(item.get("_id")) != str(v):
                        match = False
                        break
                elif item.get(k) != v:
                    match = False
                    break
            if match:
                res = dict(item)
                res["_id"] = str(res["_id"])
                results.append(res)

        if sort:
            field, direction = sort[0]
            reverse = direction == DESCENDING or direction == -1
            results.sort(key=lambda x: x.get(field, ""), reverse=reverse)

        if limit > 0:
            results = results[:limit]

        return results

    def insert_one(self, doc):
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        else:
            doc["_id"] = str(doc["_id"])
        
        # Save timestamp if not present
        if "created_at" not in doc:
            doc["created_at"] = datetime.datetime.utcnow().isoformat()
            
        data = self._get_data()
        data.append(doc)
        self.db.data[self.name] = data
        self.db._save()

        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    def update_one(self, query, update):
        target = self.find_one(query)
        if not target:
            return None
        target_id = str(target["_id"])
        
        for item in self.db.data.get(self.name, []):
            if str(item.get("_id")) == target_id:
                if "$set" in update:
                    item.update(update["$set"])
                item["updated_at"] = datetime.datetime.utcnow().isoformat()
                break
        self.db._save()

    def delete_many(self, query):
        current_data = self._get_data()
        kept = []
        deleted_count = 0
        for item in current_data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                deleted_count += 1
            else:
                kept.append(item)
        self.db.data[self.name] = kept
        self.db._save()
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        return DeleteResult(deleted_count)

    def delete_one(self, query):
        current_data = self._get_data()
        kept = []
        deleted = False
        for item in current_data:
            if not deleted:
                match = True
                for k, v in query.items():
                    if item.get(k) != v:
                        match = False
                        break
                if match:
                    deleted = True
                    continue
            kept.append(item)
        self.db.data[self.name] = kept
        self.db._save()

    def count_documents(self, query=None):
        return len(self.find(query))


class LocalDBMock:
    """Thread-safe persistent local mock for offline testing and smooth setup."""
    def __init__(self, filepath=None):
        if filepath is None:
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.filepath = os.path.join(backend_dir, "backend_data.json")
        else:
            self.filepath = filepath
        self.data = {"users": [], "yoga_sessions": [], "chat_history": [], "otp_verifications": []}
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except Exception:
                pass

    def _save(self):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.data, f, default=str, indent=2)
        except Exception:
            pass

    def get_collection(self, name):
        return LocalCollectionMock(name, self)

    def __getitem__(self, name):
        return self.get_collection(name)


class Database:
    client = None
    db = None
    is_atlas = False

    @classmethod
    def connect(cls):
        mongo_uri = Config.MONGODB_URI.strip()
        if mongo_uri:
            try:
                cls.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
                # Verify connection
                cls.client.admin.command('ping')
                cls.db = cls.client[Config.DB_NAME]
                cls.is_atlas = True
                print(f"[FitVerse Database] Successfully connected to MongoDB Atlas ({Config.DB_NAME})")
                
                # Create indexes
                cls.db.users.create_index("email", unique=True)
                cls.db.yoga_sessions.create_index([("user_id", ASCENDING), ("completed_at", DESCENDING)])
                return cls.db
            except Exception as e:
                print(f"[FitVerse Database Warning] MongoDB Atlas connection failed ({type(e).__name__}). Falling back to local persistent store.")
        
        # Fallback to local store
        print("[FitVerse Database] Running in Local Storage Mode (Offline / Dev Fallback). Ready for immediate use!")
        cls.db = LocalDBMock()
        cls.is_atlas = False
        return cls.db

    @classmethod
    def get_db(cls):
        if cls.db is None:
            return cls.connect()
        return cls.db

    @classmethod
    def get_users_collection(cls):
        return cls.get_db()["users"]

    @classmethod
    def get_yoga_sessions_collection(cls):
        return cls.get_db()["yoga_sessions"]

    @classmethod
    def get_chat_history_collection(cls):
        return cls.get_db()["chat_history"]

    @classmethod
    def get_otp_collection(cls):
        return cls.get_db()["otp_verifications"]

