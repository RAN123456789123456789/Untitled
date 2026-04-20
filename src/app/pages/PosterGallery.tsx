import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Filter, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { posters, posterCategories } from '../data/posterData';
import ThreeBackground from '../components/ThreeBackground';

export default function PosterGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredPoster, setHoveredPoster] = useState<string | null>(null);

  const filteredPosters = selectedCategory === 'all'
    ? posters
    : posters.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-white">
      <ThreeBackground />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>返回首页</span>
            </Link>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-xl tracking-wider">海报艺术</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black pointer-events-none" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-block px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <span className="text-sm">POSTER COLLECTION 2026</span>
            </div>
            <h1 className="text-6xl md:text-8xl mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                海报艺术
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              探索多元风格的视觉设计，从实验性到经典，每一张海报都是独特的艺术表达
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="sticky top-[73px] z-40 bg-black/80 backdrop-blur-xl border-y border-white/10 px-6 py-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/50">
              <Filter className="w-4 h-4" />
              <span className="text-sm">筛选</span>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-5 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white/70'
                }`}
              >
                全部作品
              </button>
              {posterCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-5 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white/70'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Posters Grid - Masonry Layout */}
      <section className="py-20 px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-white/50">
              共 {filteredPosters.length} 件作品
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosters.map((poster, index) => {
              const category = posterCategories.find(c => c.id === poster.category);
              return (
                <motion.div
                  key={poster.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredPoster(poster.id)}
                  onMouseLeave={() => setHoveredPoster(null)}
                >
                  <Link to={`/poster/${poster.id}`} className="group block">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 mb-4">
                      <img
                        src={poster.imageUrl}
                        alt={poster.title}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${category?.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                      
                      {/* Content Overlay */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="flex items-start justify-between">
                          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs">
                            {category?.name}
                          </span>
                          {poster.featured && (
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {poster.colors.slice(0, 3).map((color, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full border-2 border-white/50"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-white/70 mb-2 line-clamp-2">
                            {poster.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <h3 className="text-xl group-hover:text-purple-400 transition-colors">
                        {poster.title}
                      </h3>
                      <p className="text-sm text-white/50">{poster.subtitle}</p>
                      <div className="flex items-center gap-2 text-sm text-white/40">
                        <span>{poster.designer}</span>
                        <span>·</span>
                        <span>{poster.year}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {poster.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded text-xs bg-white/5 text-white/60"
                          >
                            #{tag}
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

      {/* Categories Overview */}
      <section className="py-20 px-6 relative bg-gradient-to-b from-black to-purple-900/10">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl mb-4">
              <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                风格探索
              </span>
            </h2>
            <p className="text-white/60">九种独特的视觉风格，诠释设计的多样性</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posterCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => setSelectedCategory(category.id)}
                className="cursor-pointer"
              >
                <div className={`relative p-8 rounded-2xl bg-gradient-to-br ${category.color} hover:scale-105 transition-transform duration-500`}>
                  <div className="absolute inset-0 bg-black/20 rounded-2xl" />
                  <div className="relative z-10">
                    <h3 className="text-2xl mb-2">{category.name}</h3>
                    <p className="text-sm text-white/90 mb-1">{category.nameEn}</p>
                    <p className="text-sm text-white/70">{category.description}</p>
                    <div className="mt-4 text-xs text-white/60">
                      {posters.filter(p => p.category === category.id).length} 件作品
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
