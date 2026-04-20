import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Palette } from 'lucide-react';
import { designCategories, designWorks } from '../data/designData';
import { useState } from 'react';

export default function DesignGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredWorks = selectedCategory === 'all'
    ? designWorks
    : designWorks.filter(work => work.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5" />
            <span>返回首页</span>
          </Link>
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5" />
            <span className="text-xl tracking-wider">视觉设计</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-7xl mb-6 tracking-tight">视觉设计</h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              探索多元风格的设计美学，从极简到复古，从未来到自然，感受视觉艺术的无限可能
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Showcase */}
      <section className="py-20 px-6 bg-zinc-900">
        <div className="container mx-auto">
          <h2 className="text-3xl mb-12">设计风格</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {designCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                onClick={() => setSelectedCategory(category.id)}
                className="cursor-pointer"
              >
                <div className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-800 mb-4">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl mb-1">{category.name}</h3>
                    <p className="text-sm text-white/60">{category.nameEn}</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm">{category.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="sticky top-[73px] z-40 bg-zinc-900/95 backdrop-blur-md -mx-6 px-6 py-6 border-y border-white/10 mb-12">
            <div className="flex items-center gap-4 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2 rounded-full transition-all whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-white text-black'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                全部作品
              </button>
              {designCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-2 rounded-full transition-all whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-white text-black'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Works Grid */}
          <h2 className="text-3xl mb-12">
            {selectedCategory === 'all'
              ? '全部作品'
              : designCategories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorks.map((work, index) => {
              const category = designCategories.find(c => c.id === work.category);
              return (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link to={`/design/${work.category}/${work.id}`}>
                    <div className="group">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-800 mb-4">
                        <img
                          src={work.imageUrl}
                          alt={work.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs">
                            {category?.name}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-xl mb-1 group-hover:text-white/70 transition-colors">
                        {work.title}
                      </h3>
                      <p className="text-white/50 text-sm mb-2">
                        {work.designer} · {work.year}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {work.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded text-xs bg-white/5 text-white/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Design Philosophy */}
      <section className="py-20 px-6 bg-black">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <h2 className="text-4xl mb-8">设计哲学</h2>
            <p className="text-xl text-white/70 leading-relaxed mb-12">
              好的设计不仅仅是视觉上的愉悦，更是功能与美学的完美平衡。
              <br />
              它能够启发思考，触动情感，创造价值。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl mb-3">形式追随功能</h3>
                <p className="text-white/60 text-sm">
                  设计的形式应该服务于功能，而非相反。优秀的设计是自然而然的，不是强加的。
                </p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl mb-3">少即是多</h3>
                <p className="text-white/60 text-sm">
                  简洁不是简单，而是去除不必要的元素，保留最本质的美。
                </p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg">
                <h3 className="text-xl mb-3">细节决定成败</h3>
                <p className="text-white/60 text-sm">
                  每一个细节都值得推敲，因为它们共同构成了整体的完美。
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
