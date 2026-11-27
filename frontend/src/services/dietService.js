import api from './api';

export const dietService = {
  async generatePlan(answers) {
    const response = await api.post('/diet/plan', { answers }, { timeout: 70000 });
    return response.data.plan;
  }
};
