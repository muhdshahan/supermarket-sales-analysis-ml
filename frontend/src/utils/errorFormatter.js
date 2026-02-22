/**
 * Format backend error messages to user-friendly strings
 */
export function formatError(error) {
  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    // Handle Django REST Framework error format
    const messages = []
    
    for (const [field, fieldErrors] of Object.entries(error)) {
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach(err => {
          // Capitalize field name and add error message
          const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          messages.push(`${fieldName}: ${err}`)
        })
      } else if (typeof fieldErrors === 'string') {
        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        messages.push(`${fieldName}: ${fieldErrors}`)
      } else {
        messages.push(JSON.stringify(fieldErrors))
      }
    }
    
    return messages.join('\n')
  }

  return 'An error occurred. Please try again.'
}

