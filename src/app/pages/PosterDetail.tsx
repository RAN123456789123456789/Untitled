import { Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Palette, User } from 'lucide-react';
import { posterCategories, posters } from '../data/posterData';

export default function PosterDetail() {
  const { id } = useParams();
  const poster = posters.find((item) => item.id === id);
  const category = poster ? posterCategories.find((item) => item.id === poster.category) : null;

  if (!poster || !category) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl mb-4">作品未找到</h2>
          <Link to="/posters" className="text-white/60 hover:text-white">
            返回海报画廊
          </Link>
        </div>
      </div>
    );
  }

  const relatedPosters = posters
    .filter((item) => item.category === poster.category && item.id !== poster.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <Link to="/posters" className="flex items-center gap-3 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>返回画廊</span>
          </Link>
        </div>
      </header>

      <section className="pt-24 pb-12 px-6 bg-black">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-3xl bg-zinc-900"
          >
            <img
              src={poster.imageUrl}
              alt={poster.title}
              className="w-full max-h-[80vh] object-cover"
            />
          </motion.div>
        </div>
      </section>

      <section className="py-12 px-6 bg-black">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-2"
            >
              <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-sm mb-4">
                {category.name}
              </span>
              <h1 className="text-5xl md:text-6xl mb-4">{poster.title}</h1>
              <p className="text-xl text-white/60 mb-8">{poster.subtitle}</p>
              <p className="text-xl text-white/70 leading-relaxed mb-8">
                {poster.description}
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {poster.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {poster.colors.map((color) => (
                  <div
                    key={color}
                    className="w-12 h-12 rounded-full border border-white/20"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="space-y-6"
            >
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <h3 className="text-sm text-white/50 mb-4">作品信息</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-white/50 mt-0.5" />
                    <div>
                      <p className="text-sm text-white/50">设计师</p>
                      <p className="text-lg">{poster.designer}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-white/50 mt-0.5" />
                    <div>
                      <p className="text-sm text-white/50">年份</p>
                      <p className="text-lg">{poster.year}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Palette className="w-5 h-5 text-white/50 mt-0.5" />
                    <div>
                      <p className="text-sm text-white/50">风格类别</p>
                      <p className="text-lg">{category.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <h3 className="text-sm text-white/50 mb-2">风格说明</h3>
                <p className="text-white/70">{category.description}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {relatedPosters.length > 0 && (
        <section className="py-20 px-6 bg-zinc-900">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl mb-12">更多同风格作品</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosters.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <Link to={`/poster/${item.id}`}>
                    <div className="group">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-800 mb-4">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      </div>
                      <h3 className="text-xl mb-1 group-hover:text-white/70 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-white/50 text-sm">
                        {item.designer} · {item.year}
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
