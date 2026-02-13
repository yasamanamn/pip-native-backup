import { Building, Form } from '../../ui/feature/summary/types';

/**
 * Building Repository
 * Handles all API calls related to buildings
 */
class BuildingRepository {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.REACT_APP_API_URL || 'https://api.example.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch building by ID from API
   */
  async fetchBuildingByIdFromApi(buildingId: string): Promise<Building | null> {
    try {
      const response = await fetch(`${this.baseUrl}/buildings/${buildingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapApiResponseToBuilding(data);
    } catch (error) {
      console.error('Error fetching building:', error);
      return null;
    }
  }

  /**
   * Fetch forms by building renovation code
   */
  async fetchFormsByBuilding(renovationCode: string): Promise<Form[] | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forms?renovationCode=${renovationCode}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication headers if needed
            // 'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapApiResponseToForms(data);
    } catch (error) {
      console.error('Error fetching forms:', error);
      return null;
    }
  }

  /**
   * Map API response to Building model
   * Adjust this based on your actual API response structure
   */
  private mapApiResponseToBuilding(data: any): Building {
    return {
      id: data.id,
      renovationCode: data.renovationCode || data.renovation_code,
      name: data.name,
      address: data.address,
      floors: data.floors?.map((floor: any) => ({
        id: floor.id,
        number: floor.number,
        plotThumbUrl: floor.plotThumbUrl || floor.plot_thumb_url,
        plotUrl: floor.plotUrl || floor.plot_url,
        isSite: floor.isSite || floor.is_site,
        isHalf: floor.isHalf || floor.is_half,
        layers: floor.layers?.map((layer: any) => ({
          id: layer.id,
          floorId: layer.floorId || layer.floor_id,
          pictureUrl: layer.pictureUrl || layer.picture_url,
          pictureThumbUrl: layer.pictureThumbUrl || layer.picture_thumb_url,
          note: layer.note,
        })) || [],
      })) || [],
    };
  }

  /**
   * Map API response to Forms array
   * Adjust this based on your actual API response structure
   */
  private mapApiResponseToForms(data: any): Form[] {
    if (Array.isArray(data)) {
      return data.map(form => ({
        id: form.id,
        formType: form.formType || form.form_type,
      }));
    }
    
    // If the response has a 'forms' or 'data' property
    if (data.forms) {
      return data.forms.map((form: any) => ({
        id: form.id,
        formType: form.formType || form.form_type,
      }));
    }
    
    if (data.data) {
      return data.data.map((form: any) => ({
        id: form.id,
        formType: form.formType || form.form_type,
      }));
    }

    return [];
  }

  /**
   * Update building (if needed)
   */
  async updateBuilding(buildingId: string, updates: Partial<Building>): Promise<Building | null> {
    try {
      const response = await fetch(`${this.baseUrl}/buildings/${buildingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapApiResponseToBuilding(data);
    } catch (error) {
      console.error('Error updating building:', error);
      return null;
    }
  }

  /**
   * Delete building (if needed)
   */
  async deleteBuilding(buildingId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/buildings/${buildingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting building:', error);
      return false;
    }
  }
}

// Export singleton instance
export const buildingRepository = new BuildingRepository();

// Also export the class for testing or custom instances
export { BuildingRepository };
