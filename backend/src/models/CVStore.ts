import { CV } from './CV';

// In-memory storage for hackathon
// TODO: Replace with actual database in production
class CVStore {
  private cvs: Map<string, CV> = new Map();

  async create(cv: CV): Promise<CV> {
    this.cvs.set(cv.id, cv);
    return cv;
  }

  async findById(id: string): Promise<CV | undefined> {
    return this.cvs.get(id);
  }

  async findByUserId(userId: string): Promise<CV | undefined> {
    return Array.from(this.cvs.values()).find(cv => cv.userId === userId);
  }

  async updateExtractedData(
    id: string,
    extractedData: CV['extractedData']
  ): Promise<CV | undefined> {
    const cv = this.cvs.get(id);
    if (cv) {
      cv.extractedData = extractedData;
      this.cvs.set(id, cv);
      return cv;
    }
    return undefined;
  }

  async deleteById(id: string): Promise<boolean> {
    return this.cvs.delete(id);
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const cv = await this.findByUserId(userId);
    if (cv) {
      return this.cvs.delete(cv.id);
    }
    return false;
  }
}

export const cvStore = new CVStore();
