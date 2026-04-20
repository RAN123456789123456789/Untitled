import { Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import { designWorks, designCategories } from '../data/designData';

export default function DesignDetail() {
  const { id } = useParams();
  const work = designWorks.find(w => w.id === id);
  const category = work ? designCategories.find(c => c.id === work.category) : null;

  if (!work || !category) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl mb-4">作品未找到</h2>
          <Link to="/design" className="text-white/60 hover:text-white">
            返回设计画廊
          </Link>
        </div>
      </div>
    );
  }

  const relatedWorks = designWorks.filter(
    w => w.category === work.category && w.id !== work.id
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <Link to="/design" className="flex items-center gap-3 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>返回画廊</span>
          </Link>
        </div>
      </header>

      {/* Hero Image */}
      <section className="pt-24 pb-12 px-6 bg-black">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="aspect-[16/9] overflow-hidden rounded-xl bg-zinc-900"
          >
            <img
              src={work.imageUrl}
              alt={work.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Work Info */}
      <section className="py-12 px-6 bg-black">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm mb-4">
                  {category.name}
                </span>
                <h1 className="text-5xl md:text-6xl mb-6">{work.title}</h1>
                <p className="text-xl text-white/70 leading-relaxed mb-8">
                  {work.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {work.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="p-6 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-sm text-white/50 mb-4">作品信息</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-white/50 mt-0.5" />
                    <div>
                      <p className="text-sm text-white/50">设计师</p>
                      <p className="text-lg">{work.designer}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-white/50 mt-0.5" />
                    <div>
                      <p className="text-sm text-white/50">创作年份</p>
                      <p className="text-lg">{work.year}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-white/50 mt-0.5" />
                    <div>
                      <p className="text-sm text-white/50">风格类别</p>
                      <p className="text-lg">{category.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-sm text-white/50 mb-2">风格特点</h3>
                <p className="text-white/70">{category.description}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Design Process */}
      <section className="py-20 px-6 bg-zinc-900">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-3xl mb-12">设计理念</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-black rounded-lg border border-white/10">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-2xl">
                  1
                </div>
                <h3 className="text-xl mb-3">灵感来源</h3>
                <p className="text-white/60">
                  从{category.name}的美学特征出发，捕捉最能代表这种风格的视觉元素和情感氛围。
                </p>
              </div>
              <div className="p-8 bg-black rounded-lg border border-white/10">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-2xl">
                  2
                </div>
                <h3 className="text-xl mb-3">视觉表达</h3>
                <p className="text-white/60">
                  通过色彩、形态、质感等视觉语言，将抽象的概念转化为具象的视觉体验。
                </p>
              </div>
              <div className="p-8 bg-black rounded-lg border border-white/10">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-2xl">
                  3
                </div>
                <h3 className="text-xl mb-3">情感共鸣</h3>
                <p className="text-white/60">
                  优秀的设计不仅要美观，更要能够触动人心，引发观者的情感共鸣和思考。
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Works */}
      {relatedWorks.length > 0 && (
        <section className="py-20 px-6 bg-black">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl mb-12">更多{category.name}作品</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedWorks.map((relatedWork, index) => (
                <motion.div
                  key={relatedWork.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/design/${relatedWork.category}/${relatedWork.id}`}>
                    <div className="group">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-800 mb-4">
                        <img
                          src={relatedWork.imageUrl}
                          alt={relatedWork.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      </div>
                      <h3 className="text-xl mb-1 group-hover:text-white/70 transition-colors">
                        {relatedWork.title}
                      </h3>
                      <p className="text-white/50 text-sm">
                        {relatedWork.designer}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
