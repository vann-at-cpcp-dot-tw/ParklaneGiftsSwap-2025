const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

import { MetadataRoute } from 'next'

const generateBlogPostsSitemapObjects = async () => {
  const response = await fetch(`${API_BASE}/blog-paths`, {
    next: { revalidate: 10 },
    method: 'GET',
  })

  const json = await response.json()

  return [
    ...(json.data.posts.map((node:{id:string|number})=>{
      return {
        url: `https://example.com/blog/${node.id}`,
        lastModified: new Date()
      }
    })),
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://example.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...(await generateBlogPostsSitemapObjects())
  ]
}