import type { ImportBatch } from '~/types'

export default defineEventHandler(async (event) => {
  // Read it as a web FormData and hand the same object straight on, so the file
  // is never re-encoded and ofetch sets its own multipart boundary.
  const form = await readFormData(event)

  if (!(form.get('file') instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      data: { file: ['Attach the dataset as `file`.'] }
    })
  }

  try {
    const batch = await apiAuthed<ImportBatch>(event, '/imports/', {
      method: 'POST',
      body: form
    })

    // Mirror the API: accepted, not created. Planning and importing happen on
    // the queue, and the client polls the batch for progress.
    setResponseStatus(event, 202)

    return batch
  } catch (error) {
    apiError(error)
  }
})
