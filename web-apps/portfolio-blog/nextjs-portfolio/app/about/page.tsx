import { FaReact, FaNode, FaDatabase, FaGitAlt } from 'react-icons/fa'
import { SiTypescript, SiTailwindcss, SiNextdotjs } from 'react-icons/si'

const skills = [
  { name: 'React', icon: FaReact, level: 90 },
  { name: 'Next.js', icon: SiNextdotjs, level: 85 },
  { name: 'TypeScript', icon: SiTypescript, level: 88 },
  { name: 'Tailwind CSS', icon: SiTailwindcss, level: 92 },
  { name: 'Node.js', icon: FaNode, level: 80 },
  { name: 'Database', icon: FaDatabase, level: 75 },
  { name: 'Git', icon: FaGitAlt, level: 85 },
]

const experiences = [
  {
    title: '全端工程師',
    company: '科技公司 A',
    period: '2023 - 現在',
    description: '負責開發與維護企業級網頁應用，使用 Next.js、TypeScript 與 PostgreSQL。',
  },
  {
    title: '前端工程師',
    company: '新創公司 B',
    period: '2021 - 2023',
    description: '開發響應式網頁應用，參與產品設計與用戶體驗優化。',
  },
  {
    title: '實習工程師',
    company: '軟體公司 C',
    period: '2020 - 2021',
    description: '協助前端開發工作，學習 React 生態系與現代化開發流程。',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">關於我</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            熱愛技術、持續學習的全端工程師
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">自我介紹</h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                你好！我是一位充滿熱情的全端工程師,專注於使用現代化技術棧打造高品質的網頁應用。
              </p>
              <p>
                我擅長使用 React、Next.js、TypeScript 等前端技術,同時也熟悉 Node.js 後端開發。
                我相信優質的程式碼不僅要功能完善,更要易於維護與擴展。
              </p>
              <p>
                除了技術開發,我也熱衷於學習新技術、分享知識,並且積極擁抱 AI 工具來提升開發效率。
                透過 GitHub Copilot、ChatGPT 等 AI 助手,我能更專注於解決問題的本質,而非重複性的工作。
              </p>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">技能專長</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map((skill) => (
              <SkillBar key={skill.name} skill={skill} />
            ))}
          </div>
        </section>

        {/* Experience */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">工作經歷</h2>
          <div className="space-y-6">
            {experiences.map((exp, index) => (
              <ExperienceCard key={index} experience={exp} />
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-12">教育背景</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-2">資訊工程學系</h3>
            <p className="text-primary-600 dark:text-primary-400 mb-2">
              國立某某大學
            </p>
            <p className="text-gray-600 dark:text-gray-400">2016 - 2020</p>
          </div>
        </section>
      </div>
    </div>
  )
}

function SkillBar({ skill }: { skill: typeof skills[0] }) {
  const Icon = skill.icon

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-4 mb-3">
        <Icon className="text-3xl text-primary-600 dark:text-primary-400" />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">{skill.name}</span>
            <span className="text-sm text-gray-500">{skill.level}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${skill.level}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExperienceCard({ experience }: { experience: typeof experiences[0] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{experience.title}</h3>
          <p className="text-primary-600 dark:text-primary-400 font-medium">
            {experience.company}
          </p>
        </div>
        <span className="text-gray-500 dark:text-gray-400 text-sm mt-2 md:mt-0">
          {experience.period}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-400">{experience.description}</p>
    </div>
  )
}
