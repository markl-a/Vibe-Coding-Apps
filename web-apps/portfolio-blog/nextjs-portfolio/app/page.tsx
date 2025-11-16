import Link from 'next/link'
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa'
import { HiArrowRight } from 'react-icons/hi'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            你好，我是開發者
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            全端工程師 | 熱衷於打造優質的網頁應用
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12">
            專注於使用現代化技術棧開發高效能、用戶友好的網頁應用。熱愛學習新技術，並透過 AI 工具提升開發效率。
          </p>

          {/* Social Links */}
          <div className="flex justify-center gap-6 mb-12">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              <FaGithub size={32} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              <FaLinkedin size={32} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              <FaTwitter size={32} />
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              查看作品集
              <HiArrowRight className="ml-2" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors font-medium"
            >
              閱讀文章
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            核心技能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <SkillCard
              title="前端開發"
              skills={['React', 'Next.js', 'TypeScript', 'Tailwind CSS']}
            />
            <SkillCard
              title="後端開發"
              skills={['Node.js', 'Express', 'PostgreSQL', 'MongoDB']}
            />
            <SkillCard
              title="開發工具"
              skills={['Git', 'Docker', 'VS Code', 'GitHub Copilot']}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function SkillCard({ title, skills }: { title: string; skills: string[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-400">
        {title}
      </h3>
      <ul className="space-y-2">
        {skills.map((skill) => (
          <li
            key={skill}
            className="text-gray-700 dark:text-gray-300 flex items-center"
          >
            <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
            {skill}
          </li>
        ))}
      </ul>
    </div>
  )
}
