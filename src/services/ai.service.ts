import { apiRequest, parseApiResponse } from '../config/api';

export interface AiCompleteResponse {
  model: string;
  text: string;
}

export const aiComplete = async (prompt: string, system?: string): Promise<AiCompleteResponse | null> => {
  try {
    const response = await apiRequest('ai/complete', {
      method: 'POST',
      body: JSON.stringify({ prompt, system }),
    });
    const data = await parseApiResponse<{ success: boolean; data?: AiCompleteResponse }>(response);
    if (data.status === 'success' && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('AI complete error:', error);
    return null;
  }
};
