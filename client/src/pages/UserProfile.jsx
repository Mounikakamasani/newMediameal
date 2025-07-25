import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function UserProfile() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const user = JSON.parse(localStorage.getItem('medimeal_user'));

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.email) {
        try {
          // Set a timeout to prevent infinite loading
          const timeoutId = setTimeout(() => {
            setLoading(false);
          }, 5000); // 5 second timeout

          // Fetch user history
          const historyPromise = axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user-input/history?email=${encodeURIComponent(user.email)}`)
            .then(res => {
              setHistory(res.data.history || []);
            })
            .catch(err => {
              console.error('Error fetching history:', err);
              setHistory([]); // Set empty array on error
            });

          // Fetch user stats from database
          const statsPromise = axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user-stats?email=${encodeURIComponent(user.email)}`)
            .then(res => {
              setStats(res.data.stats || {});
            })
            .catch(err => {
              console.error('Error fetching stats:', err);
              setStats({}); // Set empty object on error
            });

          // Fetch user profile
          const profilePromise = axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user-profile?email=${encodeURIComponent(user.email)}`)
            .then(res => {
              setUserProfile(res.data.profile);
            })
            .catch(err => {
              console.error('Error fetching profile:', err);
              setUserProfile(null); // Set null on error
            });

          // Wait for all requests or timeout
          await Promise.allSettled([historyPromise, statsPromise, profilePromise]);
          
          clearTimeout(timeoutId);
          setLoading(false);
        } catch (error) {
          console.error('Error in data fetching:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  function renderInput(input) {
    if (Array.isArray(input)) {
      return input.join('');
    } else if (typeof input === 'object' && input !== null) {
      return Object.entries(input).map(([key, value]) => (
        <div key={key} style={{ marginBottom: 'var(--space-1)' }}>
          <span style={{ fontWeight: '600', color: 'var(--secondary-700)' }}>{key}:</span>{' '}
          <span style={{ color: 'var(--secondary-600)' }}>{value}</span>
        </div>
      ));
    } else {
      return input;
    }
  }

  const handleTabClick = (tabId) => {
    console.log('handleTabClick called with:', tabId);
    console.log('Current activeTab:', activeTab);
    setActiveTab(tabId);
    console.log('Tab should change to:', tabId);
  };

  const getDashboardStats = () => {
    // Use database stats if available, otherwise calculate from history
    if (stats.totalSubmissions !== undefined) {
      return {
        totalRecommendations: stats.totalSubmissions || 0,
        recentActivity: stats.recentActivity || 0,
        avgRecommendationsPerWeek: stats.avgRecommendationsPerWeek || 0,
        memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently',
        avgCalories: stats.avgCalories || 0,
        avgProteins: stats.avgProteins || 0,
        avgCarbs: stats.avgCarbs || 0,
        avgFats: stats.avgFats || 0,
        bmi: userProfile?.bmi || 'Not available',
        healthGoal: userProfile?.healthGoal || 'Not set'
      };
    }

    // Fallback to calculating from history if database stats not available
    const totalRecommendations = history.length;
    const recentActivity = history.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length;

    const avgRecommendationsPerWeek = totalRecommendations > 0 ? Math.round(totalRecommendations / Math.max(1, Math.ceil((Date.now() - new Date(history[history.length - 1]?.createdAt || Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)))) : 0;

    return {
      totalRecommendations,
      recentActivity,
      avgRecommendationsPerWeek,
      memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'
    };
  };

  const dashboardData = getDashboardStats();

  const StatCard = ({ icon, title, value, subtitle, color = 'var(--primary-600)' }) => (
    <div className="card" style={{
      padding: 'var(--space-6)',
      textAlign: 'center',
      border: `2px solid ${color}15`,
      backgroundColor: `${color}05`
    }}>
      <div style={{
        fontSize: '2rem',
        marginBottom: 'var(--space-3)',
        color: color
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '2rem',
        fontWeight: '700',
        color: 'var(--secondary-900)',
        marginBottom: 'var(--space-1)'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'var(--secondary-700)',
        marginBottom: 'var(--space-1)'
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--secondary-500)'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Tab clicked:', id);
        onClick(id);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-4)',
        backgroundColor: isActive ? 'var(--primary-600)' : 'transparent',
        color: isActive ? 'white' : 'var(--secondary-600)',
        border: isActive ? 'none' : '1px solid var(--secondary-200)',
        borderRadius: 'var(--radius-lg)',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        zIndex: 10,
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
      onMouseDown={(e) => {
        // Fallback for stubborn clicks
        if (e.button === 0) { // Left click only
          console.log('Mouse down on tab:', id);
          onClick(id);
        }
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.target.style.backgroundColor = 'var(--secondary-100)';
          e.target.style.borderColor = 'var(--secondary-300)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.borderColor = 'var(--secondary-200)';
        }
      }}
    >
      <span style={{ 
        pointerEvents: 'none',
        userSelect: 'none'
      }}>{icon}</span>
      <span style={{ 
        pointerEvents: 'none',
        userSelect: 'none'
      }}>{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--secondary-50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--secondary-200)',
            borderTop: '4px solid var(--primary-600)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--secondary-600)', margin: 0 }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--secondary-50)',
      padding: 'var(--space-6) 0'
    }}>
      <div className="container">
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-2xl)',
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--secondary-200)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-6)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: '700',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--secondary-900)',
                marginBottom: 'var(--space-2)'
              }}>
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p style={{
                color: 'var(--secondary-600)',
                fontSize: '1rem',
                margin: 0
              }}>
                {user?.email} • Member since {dashboardData.memberSince}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4" style={{ gap: 'var(--space-4)' }}>
            <StatCard
              icon="📊"
              title="Total Recommendations"
              value={dashboardData.totalRecommendations}
              subtitle="All time"
              color="var(--primary-600)"
            />
            <StatCard
              icon="🔥"
              title="Recent Activity"
              value={dashboardData.recentActivity}
              subtitle="Last 7 days"
              color="var(--warning-600)"
            />
            <StatCard
              icon="📈"
              title="Weekly Average"
              value={dashboardData.avgRecommendationsPerWeek}
              subtitle="Recommendations per week"
              color="var(--success-600)"
            />
            <StatCard
              icon="⭐"
              title="Health Score"
              value="85%"
              subtitle="Based on your activity"
              color="var(--primary-600)"
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
          position: 'relative',
          zIndex: 5
        }}>
          <TabButton
            id="overview"
            label="Overview"
            icon="📋"
            isActive={activeTab === 'overview'}
            onClick={handleTabClick}
          />
          <TabButton
            id="history"
            label="Recommendation History"
            icon="📚"
            isActive={activeTab === 'history'}
            onClick={handleTabClick}
          />
          <TabButton
            id="health"
            label="Health Insights"
            icon="💡"
            isActive={activeTab === 'health'}
            onClick={handleTabClick}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2" style={{ gap: 'var(--space-6)' }}>
            {/* Recent Activity */}
            <div className="card">
              <div className="card-header">
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--secondary-900)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  <span>🕒</span>
                  Recent Activity
                </h3>
              </div>
              <div className="card-body">
                {history.slice(0, 3).map((entry, idx) => (
                  <div key={entry._id || idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--secondary-50)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: idx < 2 ? 'var(--space-3)' : 0
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}>
                      🍽️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--secondary-900)',
                        marginBottom: 'var(--space-1)'
                      }}>
                        Meal Recommendation
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--secondary-500)'
                      }}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--secondary-500)',
                    fontSize: '0.875rem',
                    padding: 'var(--space-8)'
                  }}>
                    No recent activity. Start by getting your first recommendation!
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--secondary-900)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  <span>⚡</span>
                  Quick Actions
                </h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <button
                    onClick={() => navigate('/recommendations')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-4)',
                      backgroundColor: 'var(--primary-50)',
                      border: '1px solid var(--primary-200)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--primary-700)',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--primary-100)';
                      e.target.style.borderColor = 'var(--primary-300)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--primary-50)';
                      e.target.style.borderColor = 'var(--primary-200)';
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>🤖</span>
                    <div>
                      <div style={{ fontWeight: '600' }}>Get AI Recommendations</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Discover personalized meal suggestions</div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/profile-wizard')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-4)',
                      backgroundColor: 'var(--success-50)',
                      border: '1px solid var(--success-200)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--success-700)',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--success-100)';
                      e.target.style.borderColor = 'var(--success-300)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--success-50)';
                      e.target.style.borderColor = 'var(--success-200)';
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>⚕️</span>
                    <div>
                      <div style={{ fontWeight: '600' }}>Update Health Profile</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Keep your information current</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header">
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--secondary-900)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <span>📚</span>
                Your Recommendation History
              </h3>
            </div>
            <div className="card-body">
              {history.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--secondary-500)',
                  padding: 'var(--space-12)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
                  <h4 style={{ color: 'var(--secondary-700)', marginBottom: 'var(--space-2)' }}>No history found</h4>
                  <p style={{ margin: 0 }}>Start by getting your first AI-powered meal recommendation!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {history.map((entry, idx) => (
                    <div key={entry._id || idx} style={{
                      backgroundColor: 'var(--secondary-50)',
                      borderRadius: 'var(--radius-xl)',
                      padding: 'var(--space-6)',
                      border: '1px solid var(--secondary-200)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-4)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem'
                          }}>
                            🍽️
                          </div>
                          <div>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: 'var(--secondary-900)'
                            }}>
                              Meal Recommendation #{history.length - idx}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: 'var(--secondary-500)'
                            }}>
                              {new Date(entry.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-6)'
                      }}>
                        <div>
                          <h4 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'var(--secondary-700)',
                            marginBottom: 'var(--space-2)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Your Input
                          </h4>
                          <div style={{
                            backgroundColor: 'white',
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--secondary-200)',
                            fontSize: '0.875rem',
                            color: 'var(--secondary-700)'
                          }}>
                            {renderInput(entry.input)}
                          </div>
                        </div>

                        <div>
                          <h4 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'var(--secondary-700)',
                            marginBottom: 'var(--space-2)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            AI Recommendations
                          </h4>
                          <div style={{
                            backgroundColor: 'white',
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--secondary-200)'
                          }}>
                            <pre style={{
                              fontSize: '0.75rem',
                              color: 'var(--secondary-600)',
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                              lineHeight: '1.5'
                            }}>
                              {entry.recommendations ? JSON.stringify(entry.recommendations, null, 2) : 'N/A'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="grid grid-cols-2" style={{ gap: 'var(--space-6)' }}>
            {/* Health Metrics */}
            <div className="card">
              <div className="card-header">
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--secondary-900)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  <span>📊</span>
                  Health Metrics
                </h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--success-50)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <span style={{ color: 'var(--secondary-700)', fontWeight: '500' }}>Nutrition Score</span>
                    <span style={{ color: 'var(--success-600)', fontWeight: '700', fontSize: '1.125rem' }}>85%</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--warning-50)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <span style={{ color: 'var(--secondary-700)', fontWeight: '500' }}>Medication Compliance</span>
                    <span style={{ color: 'var(--warning-600)', fontWeight: '700', fontSize: '1.125rem' }}>92%</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--primary-50)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <span style={{ color: 'var(--secondary-700)', fontWeight: '500' }}>Weekly Goals Met</span>
                    <span style={{ color: 'var(--primary-600)', fontWeight: '700', fontSize: '1.125rem' }}>4/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Tips */}
            <div className="card">
              <div className="card-header">
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'var(--secondary-900)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  <span>💡</span>
                  Personalized Tips
                </h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--success-50)',
                    borderLeft: '4px solid var(--success-500)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ fontWeight: '600', color: 'var(--success-700)', marginBottom: 'var(--space-1)' }}>
                      Great Progress!
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary-600)' }}>
                      You've been consistent with your meal recommendations this week.
                    </div>
                  </div>
                  <div style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--primary-50)',
                    borderLeft: '4px solid var(--primary-500)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ fontWeight: '600', color: 'var(--primary-700)', marginBottom: 'var(--space-1)' }}>
                      Tip of the Day
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary-600)' }}>
                      Try incorporating more leafy greens into your meals for better nutrient absorption.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

