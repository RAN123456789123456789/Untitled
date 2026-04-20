import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Sparkles, ChevronRight, Grid3x3, Palette, Brush } from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';
import { posters, posterCategories } from '../data/posterData';
import { calligraphyStyles } from '../data/calligraphyData';
import { designCategories } from '../data/designData';

export default function Home() {
  const featuredPosters = posters.filter(p => p.featured);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <ThreeBackground />
      
      {/* Glassmorphism Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg tracking-wider">艺术实验室</div>
                <div className="text-xs text-white/50">ART LABORATORY</div>
              </div>
            </Link>
            <nav className="flex items-center gap-8">
              <Link to="/posters" className="text-sm hover:text-purple-400 transition-colors">海报</Link>
              <Link to="/calligraphy" className="text-sm hover:text-purple-400 transition-colors">书法</Link>
              <Link to="/design" className="text-sm hover:text-purple-400 transition-colors">设计</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-black pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block mb-6 px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <span className="text-sm">清华美院 × 视觉艺术实验</span>
            </motion.div>
            
            <h1 className="text-7xl md:text-9xl mb-8 tracking-tight">
              <span className="block bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                重新定义
              </span>
              <span className="block text-white/40 mt-4">视觉艺术</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed">
              融合传统书法的东方韵味与当代设计的前卫思维
              <br />
              探索视觉艺术的无限可能
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center justify-center gap-4"
            >
              <a
                href="#featured"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all font-medium flex items-center gap-2 group"
              >
                探索作品
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#categories"
                className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all font-medium"
              >
                了解更多
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Posters - Bento Grid */}
      <section id="featured" className="py-20 px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Grid3x3 className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">精选作品</span>
            </div>
            <h2 className="text-5xl md:text-6xl mb-4">
              <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Featured Works
              </span>
            </h2>
            <p className="text-white/50 text-lg">探索最新的视觉艺术实验</p>
          </motion.div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Large Feature */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-2 md:row-span-2"
            >
              <Link to="#" className="group block relative h-full min-h-[500px] rounded-3xl overflow-hidden">
                <img
                  src={featuredPosters[0]?.imageUrl}
                  alt={featuredPosters[0]?.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs mb-3">
                    {posterCategories.find(c => c.id === featuredPosters[0]?.category)?.name}
                  </span>
                  <h3 className="text-3xl mb-2">{featuredPosters[0]?.title}</h3>
                  <p className="text-white/70">{featuredPosters[0]?.subtitle}</p>
                </div>
              </Link>
            </motion.div>

            {/* Medium Cards */}
            {featuredPosters.slice(1, 5).map((poster, index) => (
              <motion.div
                key={poster.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={index === 0 ? "md:col-span-2" : "md:col-span-1"}
              >
                <Link to="#" className="group block relative h-full min-h-[240px] rounded-2xl overflow-hidden">
                  <img
                    src={poster.imageUrl}
                    alt={poster.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl mb-1">{poster.title}</h3>
                    <p className="text-sm text-white/60">{poster.subtitle}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section id="categories" className="py-20 px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
              <Palette className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-pink-300">风格分类</span>
            </div>
            <h2 className="text-5xl md:text-6xl mb-4">
              <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                多元风格
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posterCategories.slice(0, 6).map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link to="#" className="group block">
                  <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br ${category.color} p-8 flex flex-col justify-end transition-transform duration-500 hover:scale-105`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="relative z-10">
                      <h3 className="text-3xl mb-2">{category.name}</h3>
                      <p className="text-sm text-white/80 mb-1">{category.nameEn}</p>
                      <p className="text-sm text-white/60">{category.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Calligraphy & Design Preview */}
      <section className="py-20 px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Calligraphy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                    <Brush className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-300">传统艺术</span>
                  </div>
                  <h2 className="text-4xl mb-2">中国书法</h2>
                  <p className="text-white/50">Chinese Calligraphy</p>
                </div>
                <Link to="/calligraphy" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                  查看全部
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {calligraphyStyles.slice(0, 4).map((style, index) => (
                  <motion.div
                    key={style.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Link to="/calligraphy" className="group block">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900">
                        <img
                          src={style.imageUrl}
                          alt={style.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg">{style.name}</h3>
                          <p className="text-xs text-white/60">{style.nameEn}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Design */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                    <Palette className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300">当代设计</span>
                  </div>
                  <h2 className="text-4xl mb-2">视觉设计</h2>
                  <p className="text-white/50">Visual Design</p>
                </div>
                <Link to="/design" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                  查看全部
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {designCategories.slice(0, 4).map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Link to="/design" className="group block">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900">
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg">{category.name}</h3>
                          <p className="text-xs text-white/60">{category.nameEn}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/10 to-black pointer-events-none" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <p className="text-4xl md:text-6xl mb-12 leading-relaxed">
              <span className="text-white/90">
                "在传统与创新的交汇处
                <br />
                我们探索
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                艺术的无限可能"
              </span>
            </p>
            <p className="text-white/40 text-lg">— 清华大学美术学院</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg tracking-wider">艺术实验室</div>
                  <div className="text-xs text-white/50">ART LABORATORY</div>
                </div>
              </div>
              <p className="text-white/60 text-sm max-w-md">
                致力于探索传统艺术与当代设计的融合，创造独特的视觉体验。
              </p>
            </div>
            <div>
              <h3 className="text-sm mb-4 text-white/80">快速链接</h3>
              <div className="space-y-2 text-sm text-white/50">
                <div><a href="#" className="hover:text-white transition-colors">关于我们</a></div>
                <div><a href="#" className="hover:text-white transition-colors">作品集</a></div>
                <div><a href="#" className="hover:text-white transition-colors">联系方式</a></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm mb-4 text-white/80">关注我们</h3>
              <div className="space-y-2 text-sm text-white/50">
                <div><a href="#" className="hover:text-white transition-colors">微信公众号</a></div>
                <div><a href="#" className="hover:text-white transition-colors">微博</a></div>
                <div><a href="#" className="hover:text-white transition-colors">Instagram</a></div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <p>© 2026 艺术实验室. All rights reserved.</p>
            <p>清华大学美术学院 × 视觉艺术研究</p>
          </div>
        </div>
      </footer>
    </div>
  );
}