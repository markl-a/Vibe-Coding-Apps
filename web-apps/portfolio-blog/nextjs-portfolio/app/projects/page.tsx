import Image from 'next/image'
import Link from 'next/link'
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'

const projects = [
  {
    id: 1,
    title: 'E-Commerce 平台',
    description: '全功能電商網站，包含購物車、結帳流程、訂單管理等功能。使用 Next.js 與 Stripe 整合支付。',
    image: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=600&h=400&fit=crop',
    tags: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Stripe'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 2,
    title: '任務管理系統',
    description: '協作式專案管理工具，支援看板視圖、甘特圖、團隊協作與即時通知。',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    tags: ['React', 'Node.js', 'MongoDB', 'Socket.io'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 3,
    title: '即時聊天應用',
    description: '支援一對一與群組聊天的即時通訊應用，具備訊息加密、檔案傳輸等功能。',
    image: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=600&h=400&fit=crop',
    tags: ['Vue.js', 'Firebase', 'Tailwind CSS'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 4,
    title: 'AI 圖片生成器',
    description: '整合 Stable Diffusion API 的圖片生成工具，支援多種風格與參數調整。',
    image: 'https://images.unsplash.com/photo-1547954575-855750c57bd3?w=600&h=400&fit=crop',
    tags: ['Next.js', 'AI/ML', 'Python', 'FastAPI'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 5,
    title: '健身追蹤應用',
    description: '記錄運動數據、設定目標、追蹤進度的健身管理應用。',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=400&fit=crop',
    tags: ['React Native', 'Expo', 'Supabase'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 6,
    title: '天氣資訊儀表板',
    description: '整合多個氣象 API，提供詳細天氣預報、空氣品質與天氣警報。',
    image: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=600&h=400&fit=crop',
    tags: ['React', 'Chart.js', 'Weather API'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
]

export default function ProjectsPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">作品集</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            這裡展示了我近期完成的專案，涵蓋前端、後端與全端開發
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: typeof projects[0] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{project.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {project.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex gap-4">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <FaGithub /> 原始碼
          </a>
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <FaExternalLinkAlt /> 展示
          </a>
        </div>
      </div>
    </div>
  )
}
