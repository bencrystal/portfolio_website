// Set up an image pipeline using next/image
import { ImageResponse } from 'next/server'

export const getProjectImage = (projectId: string, imageName: string) => {
  return `/projects/${projectId}/${imageName}`
} 