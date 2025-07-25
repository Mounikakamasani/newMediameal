import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Example mapping (expand as needed)
const foodImages = {
  "egg": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
  "chicken": "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=200&q=80",
  "salad": "https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=200&q=80",
  "fish": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
  "rice": "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=200&q=80",
  "apple": "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=200&q=80",
  "banana": "https://images.unsplash.com/photo-1574226516831-e1dff420e8e9?auto=format&fit=crop&w=200&q=80",
  "bread": "https://images.unsplash.com/photo-1509440159598-8b9b5cf1c2b1?auto=format&fit=crop&w=200&q=80",
  "carrot": "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=200&q=80",
  "broccoli": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
  "cheese": "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=200&q=80",
  "milk": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  "orange": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=200&q=80",
  "potato": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=200&q=80",
  "tomato": "https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=200&q=80",
  "spinach": "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=200&q=80",
  "yogurt": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
  // ...add more as needed
};
const defaultFoodImage = "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=200&q=80";

const splitVegNonVeg = (foods = []) => {
  const nonVegKeywords = ['chicken', 'fish', 'egg', 'mutton', 'beef', 'prawn', 'shrimp', 'meat', 'lamb', 'turkey', 'duck'];
  const veg = [];
  const nonveg = [];
  foods.forEach(food => {
    const lower = food.toLowerCase();
    if (nonVegKeywords.some(word => lower.includes(word))) {
      nonveg.push(food);
    } else {
      veg.push(food);
    }
  });
  return { veg, nonveg };
};

const steps = [
  { name: 'age', label: 'Age', type: 'number', required: true },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
  { name: 'foodType', label: 'Food Type', type: 'select', options: ['veg', 'nonveg', 'vegan', 'both'], required: true },
  { name: 'weightHeightBmi', label: 'Weight, Height & BMI', type: 'bmi', required: false },
  { name: 'medication', label: 'Medication', type: 'text', required: true },
  { name: 'disease', label: 'Disease', type: 'text', required: true },
];

export default function GeminiRecommend() {
  const [form, setForm] = useState({ age: '', medication: '', disease: '', gender: '', foodType: '', bmi: '', weight: '', height: '' });
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bmiCategory, setBmiCategory] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [eatenFoods, setEatenFoods] = useState([]);
  const [avoidedFoods, setAvoidedFoods] = useState([]);
  const [showRecommended, setShowRecommended] = useState(false);
  const [showNotRecommended, setShowNotRecommended] = useState(false);
  const recommendedListRef = useRef(null);
  const notRecommendedListRef = useRef(null);
  const mealTabsRef = useRef(null);
  const mealBtnRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [foodQuery, setFoodQuery] = useState('');
  const [foodWarning, setFoodWarning] = useState('');
  const [foodCheckLoading, setFoodCheckLoading] = useState(false);
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [highlightedFood, setHighlightedFood] = useState('');

  // Set default meal to breakfast when result.meals is available
  useEffect(() => {
    if (result && result.meals && !selectedMeal) {
      setSelectedMeal('breakfast');
    }
    if (!result) {
      setSelectedMeal(null);
    }
  }, [result]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('medimeal_user'));
    if (user && user.email) {
      axios.get(`http://localhost:5000/api/user-input?email=${encodeURIComponent(user.email)}`)
        .then(res => {
          if (res.data.input) setForm(f => ({ ...f, ...res.data.input }));
        });
    }
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCalculateBMI = () => {
    const weight = parseFloat(form.weight);
    const height = parseFloat(form.height) / 100;
    if (weight > 0 && height > 0) {
      const bmi = (weight / (height * height)).toFixed(1);
      setForm(f => ({ ...f, bmi }));
      let category = '';
      if (form.gender === 'Male' || form.gender === 'Female' || form.gender === 'Other') {
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal weight';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obese';
      }
      setBmiCategory(category ? `BMI Category (${form.gender}): ${category}` : '');
    }
  };

  const handleNext = e => {
    e.preventDefault();
    if (steps[step].name === 'bmi' && !form.bmi && form.weight && form.height) {
      handleCalculateBMI();
    }
    setStep(s => s + 1);
  };

  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post('http://localhost:5000/api/gemini-recommend', form);
      setResult(res.data);
      const user = JSON.parse(localStorage.getItem('medimeal_user'));
      if (user && user.email) {
        axios.post('http://localhost:5000/api/user-input', {
          email: user.email,
          input: form,
          recommendations: res.data
        });
      }
    } catch {
      setResult({ error: 'Failed to get recommendations.' });
    }
    setLoading(false);
  };

  const foodType = form.foodType || 'both';

  function handleToggleEaten(food) {
    setEatenFoods(prev => prev.includes(food) ? prev.filter(f => f !== food) : [...prev, food]);
  }
  function handleToggleAvoided(food) {
    setAvoidedFoods(prev => prev.includes(food) ? prev.filter(f => f !== food) : [...prev, food]);
  }

  useEffect(() => {
    const idx = ['Breakfast', 'Lunch', 'Dinner'].indexOf(selectedMeal);
    const btn = mealBtnRefs.current[idx];
    if (btn && mealTabsRef.current) {
      const { left: tabsLeft } = mealTabsRef.current.getBoundingClientRect();
      const { left, width } = btn.getBoundingClientRect();
      setIndicatorStyle({ left: left - tabsLeft, width });
    }
  }, [selectedMeal, result]);

  return (
    <div className="gemini-main">
      <div className="gemini-bg" />
      {/* HERO SECTION */}
      <div style={{
        position: 'relative',
        minHeight: '270px',
        width: '100%',
        background: 'linear-gradient(90deg, #0a2342 60%, #274472 100%)',
        color: '#fff',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        boxShadow: '0 2px 12px rgba(10,35,66,0.10)',
        marginBottom: 32,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: '2.5rem 0 2rem 0',
          textAlign: 'center',
        }}>
          <h1 style={{ fontWeight: 700, fontSize: '2.7rem', letterSpacing: '2px', marginBottom: 0, color: '#fff', textShadow: '0 2px 12px #0a234299' }}>Gemini Food Recommendations</h1>
          <p style={{ fontSize: '1.18rem', fontWeight: 400, marginTop: '0.7rem', color: '#e0e7ef', textShadow: '0 1px 6px #0a234288' }}>
            Personalized, health-focused meal plans powered by AI
          </p>
        </div>
      </div>
      {/* Input Card for User Details */}
      {!result && (
        <>
          <div style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="gemini-card" style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 18px #0a234211', borderTop: '4px solid #0a2342', padding: '2.2rem 2.2rem 1.7rem 2.2rem', maxWidth: 500, width: '100%' }}>
              <h2 style={{ textAlign: 'center', width: '100%', color: '#0a2342', fontWeight: 800, fontSize: '2rem', marginBottom: 24 }}>Get Food Recommendations</h2>
              <form onSubmit={step === steps.length - 1 ? handleSubmit : handleNext} style={{ width: '100%', marginTop: 0 }}>
                {(() => {
                  const s = steps[step];
                  if (s.type === 'select') {
                    return (
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ color: '#0a2342', fontWeight: 700, fontSize: '1.18rem', marginBottom: 6, display: 'block' }}>{s.label}</label>
                        <select
                          name={s.name}
                          value={form[s.name]}
                          onChange={handleChange}
                          required={s.required}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1.5px solid #a2b9d7', fontSize: '1rem', background: '#f8fafc', color: '#0a2342' }}
                        >
                          <option value="">Select {s.label}</option>
                          {s.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  if (s.type === 'bmi') {
                    return (
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ color: '#0a2342', fontWeight: 700, fontSize: '1.18rem', marginBottom: 6, display: 'block' }}>Weight (kg) & Height (cm)</label>
                        <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem' }}>
                          <input name="weight" type="number" step="0.1" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} style={{ width: '50%', padding: '0.5rem', borderRadius: 8, border: '1.5px solid #a2b9d7', fontSize: '1rem', background: '#f8fafc', color: '#0a2342' }} />
                          <input name="height" type="number" step="0.1" placeholder="Height (cm)" value={form.height} onChange={handleChange} style={{ width: '50%', padding: '0.5rem', borderRadius: 8, border: '1.5px solid #a2b9d7', fontSize: '1rem', background: '#f8fafc', color: '#0a2342' }} />
                          <button type="button" onClick={handleCalculateBMI} style={{ background: 'linear-gradient(90deg, #0a2342 60%, #274472 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.1rem', fontWeight: 500, cursor: 'pointer', fontSize: '1rem' }}>Calculate BMI</button>
                        </div>
                        {form.bmi && (
                          <input name="bmi" type="number" step="0.1" placeholder="BMI (optional)" value={form.bmi} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1.5px solid #a2b9d7', fontSize: '1rem', background: '#f8fafc', color: '#0a2342', marginTop: 8 }} />
                        )}
                      </div>
                    );
                  }
                  return (
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ color: '#0a2342', fontWeight: 700, fontSize: '1.18rem', marginBottom: 6, display: 'block' }}>{s.label}</label>
                      <input
                        name={s.name}
                        type={s.type}
                        placeholder={s.label}
                        value={form[s.name]}
                        onChange={handleChange}
                        required={s.required}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1.5px solid #a2b9d7', fontSize: '1rem', background: '#f8fafc', color: '#0a2342' }}
                      />
                    </div>
                  );
                })()}
                <div style={{ display: 'flex', justifyContent: step > 0 ? 'space-between' : 'flex-end', gap: 12 }}>
                  {step > 0 && <button type="button" onClick={handlePrev} style={{ background: '#e0e7ef', color: '#0a2342', border: 'none', borderRadius: 25, padding: '0.7rem 2rem', fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer' }}>Back</button>}
                  <button type="submit" style={{ background: 'linear-gradient(90deg, #0a2342 60%, #274472 100%)', color: '#fff', border: 'none', borderRadius: 25, padding: '0.7rem 2rem', fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer' }}>{step === steps.length - 1 ? (loading ? 'Loading...' : 'Get Recommendations') : 'Next'}</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      {result && (
        <div className="recommend-results">
          <div className="meal-tabs" ref={mealTabsRef}>
            {['Breakfast', 'Lunch', 'Dinner'].map((meal, idx) => (
              <button
                key={meal}
                ref={el => mealBtnRefs.current[idx] = el}
                className={`meal-tab${selectedMeal === meal ? ' selected' : ''}`}
                onClick={() => setSelectedMeal(meal)}
              >
                {meal}
              </button>
            ))}
            {/* Animated indicator */}
            <div
              className="meal-tab-indicator"
              style={indicatorStyle}
            />
          </div>
          {result[selectedMeal?.toLowerCase()] ? (
            <div className={`meal-output fade-in`} style={{ maxWidth: 500, margin: '0 auto', marginTop: 12 }}>
              <h3 style={{ color: '#0a2342', fontWeight: 700, fontSize: '1.3rem', marginBottom: 10 }}>{selectedMeal}</h3>
              <h4 style={{ color: '#1a237e', fontWeight: 600, fontSize: '1.1rem', marginBottom: 6 }}>Recommended:</h4>
              <ul>
                {result[selectedMeal.toLowerCase()]?.recommended?.map((item, idx) =>
                  <li key={idx}>{item.food} - {item.quantity}</li>
                )}
              </ul>
              <h4 style={{ color: '#b71c1c', fontWeight: 600, fontSize: '1.1rem', marginBottom: 6 }}>Not Recommended:</h4>
              <ul>
                {result[selectedMeal.toLowerCase()]?.not_recommended?.map((food, idx) =>
                  <li key={idx} style={food.toLowerCase().includes(highlightedFood) ? { background: '#ffebee', animation: 'shake 0.4s' } : {}}>
                    {food}
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#b71c1c', marginTop: 32, fontWeight: 600 }}>
              {/* No recommendations message intentionally left blank for minimalism */}
            </div>
          )}
          <div style={{ margin: '1.5rem auto 0 auto', maxWidth: 400, textAlign: 'center' }}>
            <form onSubmit={async e => {
              e.preventDefault();
              setFoodWarning('');
              setHighlightedFood('');
              const mealData = result[selectedMeal?.toLowerCase()];
              const query = foodQuery.trim();
              if (!query) return setFoodWarning('');
              setFoodCheckLoading(true);
              try {
                const res = await axios.post('http://localhost:5000/api/gemini-food-check', {
                  disease: form.disease,
                  medication: form.medication,
                  food: query
                });
                setFoodWarning(res.data.warning);
                // Highlight if in not recommended
                if (mealData?.not_recommended?.some(food => food.toLowerCase().includes(query.toLowerCase()))) {
                  setHighlightedFood(query.toLowerCase());
                } else {
                  setHighlightedFood('');
                }
              } catch {
                setFoodWarning('Could not check food safety.');
                setHighlightedFood('');
              }
              setFoodCheckLoading(false);
            }} style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', position: 'relative' }} autoComplete="off">
              <div style={{ position: 'relative', width: 200 }}>
                <input
                  type="text"
                  value={foodQuery}
                  onChange={e => {
                    setFoodQuery(e.target.value);
                    setFoodWarning('');
                    setHighlightedFood('');
                    // Auto-suggestions
                    const mealData = result[selectedMeal?.toLowerCase()];
                    const query = e.target.value.trim().toLowerCase();
                    if (!query || !mealData) return setFoodSuggestions([]);
                    const allFoods = [
                      ...(mealData.recommended?.map(f => typeof f === 'string' ? f : f.food) || []),
                      ...(mealData.not_recommended || [])
                    ];
                    setFoodSuggestions(
                      allFoods.filter(f => f.toLowerCase().includes(query)).slice(0, 5)
                    );
                  }}
                  placeholder="Ask about a specific food..."
                  style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1.5px solid #b0bec5', fontSize: '1rem', width: '100%' }}
                  autoComplete="off"
                />
                {foodSuggestions.length > 0 && (
                  <ul style={{ position: 'absolute', left: 0, right: 0, top: '110%', background: '#fff', border: '1px solid #b0bec5', borderRadius: 8, boxShadow: '0 2px 8px #0a234211', margin: 0, padding: 0, zIndex: 10, listStyle: 'none', fontSize: '1rem' }}>
                    {foodSuggestions.map((s, i) => (
                      <li key={i} style={{ padding: '0.5rem 1rem', cursor: 'pointer', color: '#263238' }} onClick={() => { setFoodQuery(s); setFoodSuggestions([]); }}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button type="submit" style={{ padding: '0.6rem 1.3rem', borderRadius: 8, background: '#1a237e', color: '#fff', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }} disabled={foodCheckLoading}>Check</button>
              {foodQuery && (
                <button type="button" onClick={() => { setFoodQuery(''); setFoodWarning(''); setHighlightedFood(''); setFoodSuggestions([]); }} style={{ marginLeft: 4, background: 'none', border: 'none', color: '#b0bec5', fontSize: '1.3rem', cursor: 'pointer' }} title="Clear">×</button>
              )}
            </form>
            {foodCheckLoading && <div style={{ marginTop: 10, fontWeight: 600, color: '#1a237e', animation: 'fade-in 0.5s' }}>Checking<span className="dot-anim">...</span></div>}
            {!foodCheckLoading && foodWarning && (
              <div style={{ marginTop: 10, fontWeight: 600, animation: 'fade-in 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {/* Remove emoji/icons, just show text with color */}
                <span style={{ color: foodWarning.toLowerCase().includes('not safe') || foodWarning.toLowerCase().includes('avoid') ? '#b71c1c' : '#1a7e23', fontWeight: 700 }}>
                  {foodWarning}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FoodItem({ food, icon, type }) {
  const [active, setActive] = useState(false);
  const [showTip, setShowTip] = useState(false);
  let tip = '';
  if (type === 'recommended') tip = 'Tap to mark as eaten';
  else if (type === 'not_recommended') tip = 'Tap to mark as avoided';
  else tip = 'Tap to mark as eaten';
  return (
    <li
      style={{
        fontSize: '1.13rem',
        display: 'flex',
        alignItems: 'center',
        padding: '1rem 1.2rem',
        borderBottom: type === 'not_recommended' ? '1px solid #fbeaea' : '1px solid #e0e7ef',
        borderRadius: 14,
        background: active ? (type === 'not_recommended' ? '#fca5a5' : '#bbf7d0') : 'none',
        color: active ? '#fff' : undefined,
        boxShadow: active ? '0 2px 12px #0a234233' : undefined,
        cursor: 'pointer',
        marginBottom: 2,
        position: 'relative',
        transition: 'background 0.25s, color 0.25s, box-shadow 0.25s, transform 0.18s',
        touchAction: 'manipulation',
        minHeight: 48,
      }}
      onClick={() => {
        setActive(true);
        setTimeout(() => setActive(false), 400);
      }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      onTouchStart={() => setShowTip(true)}
      onTouchEnd={() => setShowTip(false)}
    >
      <span style={{ marginRight: 12, fontSize: 26 }}>{icon}</span> {food}
      {showTip && (
        <span style={{
          position: 'absolute',
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#0a2342',
          color: '#fff',
          fontSize: '0.97rem',
          borderRadius: 8,
          padding: '0.3rem 0.7rem',
          marginLeft: 10,
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: '0 2px 8px #0a234233',
        }}>{tip}</span>
      )}
    </li>
  );
} 