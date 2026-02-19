import React, { useState, useEffect } from "react";
import "./App.css";
import { supabase, getCurrentUser } from "./lib/supabase";
import Login from "./login";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zestawy, setZestawy] = useState([]);
  const [fiszki, setFiszki] = useState([]);
  const [selectedZestaw, setSelectedZestaw] = useState(null);
  const [mode, setMode] = useState("learn");

  const [newZestaw, setNewZestaw] = useState("");
  const [newFiszka, setNewFiszka] = useState({
    slowo: "",
    definicja: "",
    zdanie: "",
  });

  const [learningQueue, setLearningQueue] = useState([]);
  const [mastered, setMastered] = useState([]);
  const [flipMode, setFlipMode] = useState(true);
  const [isFlipped, setIsFlipped] = useState(flipMode);

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({});

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchZestawy(session.user.id);
    });

    return () => authListener?.subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const user = await getCurrentUser();
    setUser(user);
    if (user) fetchZestawy(user.id);
    setLoading(false);
  };

  // Pobierz zestawy TYLKO zalogowanego użytkownika
  const fetchZestawy = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("zestawy")
        .select("*")
        .eq("user_id", userId)
        .order("id_zestawu", { ascending: true });
      
      if (error) throw error;
      setZestawy(data || []);
    } catch (error) {
      console.error("Błąd pobierania zestawów:", error.message);
    }
  };

  // Pobierz fiszki dla wybranego zestawu
  const fetchFiszki = async (id_zestawu) => {
    setSelectedZestaw(id_zestawu);
    try {
      const { data, error } = await supabase
        .from("fiszki")
        .select("*")
        .eq("id_zestawu", id_zestawu)
        .order("id_fiszki", { ascending: true });
      
      if (error) throw error;
      
      // Mapuj front/back na slowo/definicja
      const przeksztalcone = (data || []).map(f => ({
        id_fiszki: f.id_fiszki,
        id_zestawu: f.id_zestawu,
        slowo: f.front,
        definicja: f.back,
        zdanie: f.zdanie || ""
      }));
      
      setFiszki(przeksztalcone);
      setLearningQueue(przeksztalcone);
      setMastered([]);
      setIsFlipped(flipMode);
    } catch (error) {
      console.error("Błąd pobierania fiszek:", error.message);
    }
  };

  // Dodaj zestaw z user_id
  const addZestaw = async () => {
    if (!newZestaw.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from("zestawy")
        .insert([{ 
          nazwa_zestawu: newZestaw,
          user_id: user.id 
        }])
        .select()
        .single();
      
      if (error) throw error;
      setZestawy([...zestawy, data]);
      setNewZestaw("");
    } catch (error) {
      console.error("Błąd dodawania zestawu:", error.message);
      alert("Nie udało się dodać zestawu");
    }
  };

  // Dodaj fiszkę
  const addFiszka = async () => {
    if (!newFiszka.slowo || !newFiszka.definicja || !newFiszka.zdanie) {
      alert("Wszystkie pola są wymagane!");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("fiszki")
        .insert([{
          id_zestawu: selectedZestaw,
          front: newFiszka.slowo,
          back: newFiszka.definicja,
          zdanie: newFiszka.zdanie
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const nowaFiszka = {
        id_fiszki: data.id_fiszki,
        id_zestawu: data.id_zestawu,
        slowo: data.front,
        definicja: data.back,
        zdanie: data.zdanie || ""
      };
      
      setFiszki([...fiszki, nowaFiszka]);
      setLearningQueue([...learningQueue, nowaFiszka]);
      setNewFiszka({ slowo: "", definicja: "", zdanie: "" });
    } catch (error) {
      console.error("Błąd dodawania fiszki:", error.message);
      alert("Nie udało się dodać fiszki");
    }
  };

  const current = learningQueue[0];

  const handleKnow = () => {
    if (!current) return;
    setMastered([...mastered, current]);
    setLearningQueue(learningQueue.slice(1));
    setIsFlipped(flipMode);
  };

  const handleDontKnow = () => {
    if (!current) return;
    setLearningQueue([...learningQueue.slice(1), current]);
    setIsFlipped(flipMode);
  };

  const handleReset = () => {
    setLearningQueue(fiszki);
    setMastered([]);
    setIsFlipped(flipMode);
  };

  useEffect(() => {
    if (learningQueue.length === 0 && mastered.length > 0) {
      handleReset();
    }
  }, [learningQueue, mastered]);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setZestawy([]);
    setSelectedZestaw(null);
    setFiszki([]);
  };

  if (loading) return <div className="loading">Ładowanie...</div>;
  
  if (!user) {
    return <Login onLogin={(user) => setUser(user)} />;
  }

  return (
    <div className={`App ${settings.darkMode ? "dark-mode" : ""}`}>
      <header>
        <h1>Fiszki</h1>
        <div className="header-right">
          <span className="user-email">{user.email}</span>
          <button onClick={logout} className="logout-btn">Wyloguj</button>
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Ustawienia"
          >
            ⚙️
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h3>Ustawienia</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="settings-content"> 
              <div className="setting-item">
                <button onClick={() => setFlipMode(!flipMode)}>
                  {flipMode ? "Tryb: Definicja → Słowo" : "Tryb: Słowo → Definicja"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main>
        <aside id="menu-zestawow">
          <h2>Zestawy</h2>
          <div className="zestawy-list">
            {zestawy.map(z => (
              <button
                key={z.id_zestawu}
                className="btn-zestaw"
                onClick={() => fetchFiszki(z.id_zestawu)}
              >
                {z.nazwa_zestawu}
              </button>
            ))}
          </div>
          <div className="add-zestaw">
            <input
              type="text"
              placeholder="Nowy zestaw"
              value={newZestaw}
              onChange={e => setNewZestaw(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addZestaw()}
            />
            <button onClick={addZestaw}>Dodaj</button>
          </div>
        </aside>

        <section id="fiszki-container">
          {selectedZestaw ? (
            <div className="panel">
              <h2>
                {zestawy.find(z => z.id_zestawu === selectedZestaw)?.nazwa_zestawu}
              </h2>

              <div className="mode-selection">
                <button onClick={() => setMode("view")}>Przeglądaj</button>
                <button onClick={() => setMode("learn")}>Ucz się</button>
                <button onClick={() => setMode("add")}>Dodaj fiszkę</button>
              </div>

              {mode === "add" && (
                <div className="add-fiszka">
                  <input
                    placeholder="Słowo"
                    value={newFiszka.slowo}
                    onChange={e => setNewFiszka({...newFiszka, slowo: e.target.value})}
                  />
                  <input
                    placeholder="Definicja"
                    value={newFiszka.definicja}
                    onChange={e => setNewFiszka({...newFiszka, definicja: e.target.value})}
                  />
                  <input
                    placeholder="Zdanie"
                    value={newFiszka.zdanie}
                    onChange={e => setNewFiszka({...newFiszka, zdanie: e.target.value})}
                  />
                  <button onClick={addFiszka}>Dodaj fiszkę</button>
                </div>
              )}

              {mode === "view" && (
                <div className="view-fiszki">
                  {fiszki.map(f => (
                    <div key={f.id_fiszki} className="fiszka-view">
                      <h4>{f.slowo}</h4>
                      <p>{f.definicja}</p>
                      <em>{f.zdanie}</em>
                    </div>
                  ))}
                </div>
              )}

              {mode === "learn" && current && (
                <div className="learn-fiszki">
                  <div className="fiszka" onClick={() => setIsFlipped(!isFlipped)}>
                    {isFlipped ? (
                      <>
                        <h3>{current.definicja}</h3>
                        <p>{current.zdanie}</p>
                      </>
                    ) : (
                      <h3>{current.slowo}</h3>
                    )}
                  </div>
                  <div className="learn-buttons">
                    <button onClick={handleKnow} id="btn-umiem">UMIEM</button>
                    <button onClick={handleReset} id="btn-reset">RESET</button>
                    <button onClick={handleDontKnow} id="btn-nieumiem">NIE UMIEM</button>
                  </div>
                  <p>Pozostało: {learningQueue.length}</p>
                </div>
              )}

              {!current && mode === "learn" && (
                <p>Wszystkie fiszki opanowane – trwa reset...</p>
              )}
            </div>
          ) : (
            <p>Wybierz zestaw aby rozpocząć.</p>
          )}
        </section>
      </main>
    </div>
  );
}