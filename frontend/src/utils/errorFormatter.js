/**
 * Format backend error messages to user-friendly strings
 */
export function formatError(error) {
  if (!error) return 'An error occurred. Please try again.'

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    // If it's a detail message (common in DRF)
    if (error.detail && typeof error.detail === 'string') {
      return error.detail
    }

    const messages = []

    const extractMessages = (obj, parentField = '') => {
      if (typeof obj === 'string') {
        if (parentField && !['detail', 'non_field_errors', 'error'].includes(parentField)) {
          const fieldName = parentField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          return [`${fieldName}: ${obj}`]
        }
        return [obj]
      }

      if (Array.isArray(obj)) {
        return obj.flatMap(item => extractMessages(item, parentField))
      }

      if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj).flatMap(([key, value]) => extractMessages(value, key))
      }

      return [JSON.stringify(obj)]
    }

    const allMessages = extractMessages(error)

    if (allMessages.length === 0) {
      return 'An error occurred. Please try again.'
    }

    if (allMessages.length === 1) {
      return allMessages[0]
    }

    // Join multiple messages with bullets for better readability
    return allMessages.map(m => `• ${m}`).join('\n')
  }

  return 'An error occurred. Please try again.'
}

