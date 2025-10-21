/**
 * 実績ページ
 * 全実績の進捗を表示
 */

import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3030';

interface Achievement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: string;
  rarity: string;
}

const rarityConfig = {
  common: {
    gradient: 'from-slate-600 to-slate-700',
    bgGradient: 'from-slate-500/10 to-slate-600/10',
    label: 'コモン',
    glow: 'shadow-slate-500/30',
    border: 'border-slate-400/30',
    textColor: 'text-slate-300',
  },
  uncommon: {
    gradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-500/10 to-emerald-600/10',
    label: 'アンコモン',
    glow: 'shadow-emerald-500/30',
    border: 'border-emerald-400/30',
    textColor: 'text-emerald-300',
  },
  rare: {
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-500/10 to-blue-600/10',
    label: 'レア',
    glow: 'shadow-blue-500/30',
    border: 'border-blue-400/30',
    textColor: 'text-blue-300',
  },
  epic: {
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-500/10 to-purple-600/10',
    label: 'エピック',
    glow: 'shadow-purple-500/30',
    border: 'border-purple-400/30',
    textColor: 'text-purple-300',
  },
  legendary: {
    gradient: 'from-amber-400 to-orange-500',
    bgGradient: 'from-amber-400/10 to-orange-500/10',
    label: 'レジェンダリー',
    glow: 'shadow-amber-400/30',
    border: 'border-amber-400/30',
    textColor: 'text-amber-300',
  },
  mythic: {
    gradient: 'from-pink-500 via-purple-500 to-indigo-500',
    bgGradient: 'from-pink-500/10 via-purple-500/10 to-indigo-500/10',
    label: 'ミシック',
    glow: 'shadow-pink-500/30',
    border: 'border-pink-400/30',
    textColor: 'text-pink-300',
  },
};

export function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAchievements();
    const interval = setInterval(fetchAchievements, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/achievements`);
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('実績取得エラー:', error);
    }
  };

  const completedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'all') return true;
    if (filter === 'completed') return achievement.completed;
    if (filter === 'incomplete') return !achievement.completed;
    return achievement.rarity === filter;
  });

  const getRarityConfig = (rarity: string) => {
    return rarityConfig[rarity as keyof typeof rarityConfig] || rarityConfig.common;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-4">
            <div className="text-7xl mb-4 animate-bounce">🏆</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent mb-4">
            実績コレクション
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            練習を続けて実績を解除しよう。レア度が高いほど達成が困難！
          </p>
        </div>

        {/* 進捗サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* 総合達成率 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-purple-700 text-sm font-semibold uppercase tracking-wide">達成率</span>
                <span className="text-4xl">📊</span>
              </div>
              <div className="text-5xl font-bold text-gray-800 mb-3">
                {completionPercentage.toFixed(1)}<span className="text-2xl text-purple-600">%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 h-3 rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: `${completionPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 解除済み */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-blue-700 text-sm font-semibold uppercase tracking-wide">解除済み</span>
                <span className="text-4xl">✨</span>
              </div>
              <div className="text-5xl font-bold text-gray-800 mb-1">
                {completedCount}
              </div>
              <p className="text-blue-600 text-sm">
                全{totalCount}個中
              </p>
            </div>
          </div>

          {/* 未達成 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-orange-700 text-sm font-semibold uppercase tracking-wide">未達成</span>
                <span className="text-4xl">🎯</span>
              </div>
              <div className="text-5xl font-bold text-gray-800 mb-1">
                {totalCount - completedCount}
              </div>
              <p className="text-orange-600 text-sm">
                挑戦しよう！
              </p>
            </div>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 mb-8 border border-blue-200/50 shadow-lg">
          <div className="flex flex-wrap gap-3">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              gradient="from-gray-600 to-gray-700"
            >
              すべて
            </FilterButton>
            <FilterButton
              active={filter === 'completed'}
              onClick={() => setFilter('completed')}
              gradient="from-green-600 to-emerald-600"
            >
              ✓ 達成済み
            </FilterButton>
            <FilterButton
              active={filter === 'incomplete'}
              onClick={() => setFilter('incomplete')}
              gradient="from-orange-600 to-red-600"
            >
              ⏳ 未達成
            </FilterButton>

            <div className="hidden md:block w-px bg-gray-600 mx-2"></div>

            {Object.entries(rarityConfig).map(([rarity, config]) => (
              <FilterButton
                key={rarity}
                active={filter === rarity}
                onClick={() => setFilter(rarity)}
                gradient={config.gradient}
              >
                {config.label}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* 実績グリッド */}
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => {
              const config = getRarityConfig(achievement.rarity);

              return (
                <div
                  key={achievement.id}
                  className={`relative group transition-all duration-300 ${
                    achievement.completed
                      ? 'hover:scale-105 hover:-translate-y-2'
                      : 'opacity-60 hover:opacity-80'
                  }`}
                >
                  {/* グロー効果 */}
                  {achievement.completed && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity`}></div>
                  )}

                  {/* カード本体 */}
                  <div className={`relative rounded-2xl p-6 border-2 transition-all ${
                    achievement.completed
                      ? `bg-gradient-to-br ${config.bgGradient} backdrop-blur-sm ${config.border} ${config.glow} shadow-xl`
                      : 'bg-white/70 border-gray-300/50 backdrop-blur-sm shadow-md'
                  }`}>

                    {/* レア度バッジ */}
                    <div className="absolute -top-3 -right-3">
                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                        achievement.completed
                          ? `bg-gradient-to-r ${config.gradient} text-white`
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {config.label}
                      </div>
                    </div>

                    {/* アイコン */}
                    <div className="mb-4 relative">
                      <div className={`text-7xl transition-all ${
                        achievement.completed
                          ? 'filter-none'
                          : 'grayscale opacity-30'
                      }`}>
                        {achievement.icon}
                      </div>
                      {achievement.completed && (
                        <div className="absolute -bottom-2 -right-2 text-3xl animate-bounce">
                          ✨
                        </div>
                      )}
                    </div>

                    {/* タイトル */}
                    <h3 className={`text-xl font-bold mb-2 ${
                      achievement.completed
                        ? 'text-gray-800'
                        : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </h3>

                    {/* 説明 */}
                    <p className={`text-sm mb-4 ${
                      achievement.completed
                        ? 'text-gray-600'
                        : 'text-gray-500'
                    }`}>
                      {achievement.description}
                    </p>

                    {/* ステータス */}
                    {achievement.completed ? (
                      <div className={`flex items-center gap-2 ${config.textColor}`}>
                        <span className="text-2xl">🎉</span>
                        <span className="text-sm font-bold">達成済み</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="text-2xl">🔒</span>
                        <span className="text-sm font-bold">ロック中</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <p className="text-gray-600 text-xl">該当する実績がありません</p>
            <p className="text-gray-500 text-sm mt-2">別のフィルターを試してみてください</p>
          </div>
        )}
      </div>
    </div>
  );
}

// フィルターボタンコンポーネント
function FilterButton({
  active,
  onClick,
  gradient,
  children
}: {
  active: boolean;
  onClick: () => void;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
        active
          ? `bg-gradient-to-r ${gradient} text-white shadow-lg scale-105`
          : 'bg-gray-200/70 text-gray-700 hover:bg-gray-300/70 hover:scale-102'
      }`}
    >
      {children}
    </button>
  );
}
