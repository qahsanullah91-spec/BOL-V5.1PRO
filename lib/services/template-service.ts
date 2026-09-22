import { createClient } from '@/lib/supabase/client'

export class TemplateService {
  private supabase = createClient()

  // Fetch all templates
  async fetchTemplates() {
    try {
      const response = await fetch('/api/templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      return await response.json()
    } catch (error) {
      console.error('[v0] Error fetching templates:', error)
      throw error
    }
  }

  // Create new template
  async createTemplate(name: string, description: string, templateData: any) {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, template_data: templateData }),
      })
      if (!response.ok) throw new Error('Failed to create template')
      return await response.json()
    } catch (error) {
      console.error('[v0] Error creating template:', error)
      throw error
    }
  }

  // Set template as default
  async setDefaultTemplate(templateId: string) {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })
      if (!response.ok) throw new Error('Failed to set default template')
      return await response.json()
    } catch (error) {
      console.error('[v0] Error setting default template:', error)
      throw error
    }
  }

  // Delete template
  async deleteTemplate(templateId: string) {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete template')
      return await response.json()
    } catch (error) {
      console.error('[v0] Error deleting template:', error)
      throw error
    }
  }
}

// Export singleton instance
export const templateService = new TemplateService()
