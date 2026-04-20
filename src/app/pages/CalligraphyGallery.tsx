import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Brush } from 'lucide-react';
import { calligraphyStyles, calligraphyWorks } from '../data/calligraphyData';
import { useState } from 'react';

export default function CalligraphyGallery() {
  const [selectedStyle, setSelectedStyle] = useState<string>('all');

  const filteredWorks = selectedStyle === 'all'
    ? calligraphyWorks
    : calligraphyWorks.filter(work => work.style === selectedStyle);

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
            <Brush className="w-5 h-5" />
            <span className="text-xl tracking-wider">书法艺术</span>
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
            <h1 className="text-6xl md:text-7xl mb-6 tracking-tight">中国书法</h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              五体皆备，笔墨千秋。从篆书的古朴到草书的飞动，感受汉字艺术的无穷魅力
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-[73px] z-40 bg-zinc-900/95 backdrop-blur-md border-b border-white/10 px-6 py-6">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button
              onClick={() => setSelectedStyle('all')}
              className={`px-6 py-2 rounded-full transition-all whitespace-nowrap ${
                selectedStyle === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              全部
            </button>
            {calligraphyStyles.map(style => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`px-6 py-2 rounded-full transition-all whitespace-nowrap ${
                  selectedStyle === style.id
                    ? 'bg-white text-black'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 px-6 bg-zinc-900">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorks.map((work, index) => {
              const style = calligraphyStyles.find(s => s.id === work.style);
              return (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link to={`/calligraphy/${work.style}/${work.id}`}>
                    <div className="group">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-800 mb-4">
                        <img
                          src={work.imageUrl}
                          alt={work.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs">
                            {style?.name}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-2xl mb-1 group-hover:text-white/70 transition-colors">
                        {work.title}
                      </h3>
                      <p className="text-white/50 text-sm">
                        {work.artist} · {work.year}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Calligraphy */}
      <section className="py-20 px-6 bg-black">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="space-y-8"
          >
            <h2 className="text-4xl mb-8">书法五体</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {calligraphyStyles.map(style => (
                <div key={style.id} className="p-6 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-xl mb-2">{style.name} {style.nameEn}</h3>
                  <p className="text-white/60 text-sm">{style.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
