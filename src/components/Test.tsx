import { useState, useEffect } from 'react';
import PokemonCard from './PokemonCard';



const typeConfig: { [key: string]: { color: string; icon: string } } = {
    normal: { color: '#A8A77A', icon: '🐾' }, fire: { color: '#EE8130', icon: '🔥' },
    water: { color: '#6390F0', icon: '💧' }, electric: { color: '#F7D02C', icon: '⚡' },
    grass: { color: '#7AC74C', icon: '🌿' }, ice: { color: '#96D9D6', icon: '❄️' },
    fighting: { color: '#C22E28', icon: '🥊' }, poison: { color: '#A33EA1', icon: '☠️' },
    ground: { color: '#E2BF65', icon: '🏜️' }, flying: { color: '#A98FF3', icon: '🌪️' },
    psychic: { color: '#F95587', icon: '🔮' }, bug: { color: '#A6B91A', icon: '🐛' },
    rock: { color: '#B6A136', icon: '🪨' }, ghost: { color: '#735797', icon: '👻' },
    dragon: { color: '#6F35FC', icon: '🐉' }, dark: { color: '#705746', icon: '🌙' },
    steel: { color: '#B7B7CE', icon: '⚙️' }, fairy: { color: '#D685AD', icon: '✨' },
};

interface Pokemon { name: string; url: string; }
interface PokemonDetail { 
    id: number; name: string; height: number; weight: number; 
    types: { type: { name: string } }[]; 
    stats: { base_stat: number, stat: { name: string } }[]; 
    sprites: { front_default: string;front_shiny: string; other?: { showdown?: { front_default: string ; front_shiny: string } } }; 
}
interface CaughtPokemon { id: number; name: string; }

interface EvolutionDetail {
    id: number;
    name: string;
    image: string;
}

interface EvolutionChain {
    species: {name: string; url: string;};
    evolves_to: EvolutionChain[];
}


function Pokedex() {
    const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);
    const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [typePokemons, setTypePokemons] = useState<string[]>([]);
    const [isShiny, setIsShiny] = useState<boolean>(false);
    const [evolutionChain, setEvolutionChain] = useState<EvolutionDetail[]>([]);
    const [sortBy, setSortBy] = useState<string>('id-asc');
    const [myTeam, setMyTeam] = useState<CaughtPokemon[]>(() => {
        const savedData = localStorage.getItem('myPokemonTeam');
        return savedData ? JSON.parse(savedData) : [];
    });
    const [isShowingMyTeam, setIsShowingMyTeam] = useState<boolean>(false);
    const [bgBlob1, setBgBlob1] = useState<string>('#3b82f6');
    const [bgBlob2, setBgBlob2] = useState<string>('#f43f5e');

    useEffect(() => {
        if (selectedPokemon && selectedPokemon.types && selectedPokemon.types.length > 0) {
            // ดึงธาตุที่ 1 และธาตุที่ 2 (ถ้ามี)
            const type1 = selectedPokemon.types[0].type.name;
            const type2 = selectedPokemon.types[1] ? selectedPokemon.types[1].type.name : type1;

            // เอาชื่อธาตุไปเทียบหาโค้ดสีใน typeConfig
            const color1 = typeConfig[type1]?.color || '#3b82f6';
            // ถ้ามีธาตุเดียว ให้สีที่สองเป็นสีชมพูเริ่มต้น จะได้ดูมีมิติ
            const color2 = selectedPokemon.types.length > 1 ? typeConfig[type2]?.color : '#f43f5e';

            setBgBlob1(color1);
            setBgBlob2(color2);
        } else {
            // ถ้าปิด Modal ให้กลับไปเป็นสีฟ้า-ชมพู เหมือนเดิม
            setBgBlob1('#3b82f6');
            setBgBlob2('#f43f5e');
        }
    }, [selectedPokemon]);

    useEffect(() => { localStorage.setItem('myPokemonTeam', JSON.stringify(myTeam)); }, [myTeam]);
    useEffect(() => {
        setIsLoading(true);
        fetch('https://pokeapi.co/api/v2/pokemon?limit=10000')
            .then(res => res.json())
            .then(data => { setAllPokemons(data.results); setIsLoading(false); })
            .catch(() => setIsLoading(false));
    }, []);
    useEffect(() => {
        if (typeFilter === 'all') {
            setTypePokemons([]);
            return;
        }
        setIsLoading(true);
        fetch(`https://pokeapi.co/api/v2/type/${typeFilter}`)
            .then(res => res.json())
            .then(data => {
                // สกัดเอามาแค่ "ชื่อ" ของโปเกมอนธาตุนั้นๆ
                const names = data.pokemon.map((p: any) => p.pokemon.name);
                setTypePokemons(names);
                setIsLoading(false);
                setCurrentPage(1); // กลับไปหน้า 1
            });
    }, [typeFilter]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, sortBy]);

    const extractIdFromUrl = (url: string) => parseInt(url.split('/').filter(Boolean).pop() || '0');
    const openModal = async (id: number) => {
        setIsModalLoading(true); 
        setSelectedPokemon({} as PokemonDetail);
        setIsShiny(false);
        setEvolutionChain([]);

        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const data = await res.json();
            setSelectedPokemon(data);

            const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
            const speciesData = await speciesRes.json();

            const evoRes = await fetch(speciesData.evolution_chain.url);
            const evoData = await evoRes.json();

            const evoList: EvolutionDetail[] = [];
            let currentEvo: EvolutionChain = evoData.chain;

            while (currentEvo) {
                const evoId = extractIdFromUrl(currentEvo.species.url);
                evoList.push({
                    id: evoId,
                    name: currentEvo.species.name,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evoId}.png`
                });
                currentEvo = currentEvo.evolves_to[0];
            }
            
            setEvolutionChain(evoList);
            setIsModalLoading(false);
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
            setIsModalLoading(false);
        }
    };

    const toggleCatch = () => {
        if (!selectedPokemon) return;
        const isCaught = myTeam.some(p => p.id === selectedPokemon.id);
        if (isCaught) setMyTeam(myTeam.filter(p => p.id !== selectedPokemon.id));
        else setMyTeam([...myTeam, { id: selectedPokemon.id, name: selectedPokemon.name }]);
    };

    let filtered = allPokemons.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()));
    if (typeFilter !== 'all') {
        // ถ้าเลือกธาตุ ให้คัดเฉพาะตัวที่ชื่อตรงกับรายชื่อธาตุนั้น
        filtered = filtered.filter(p => typePokemons.includes(p.name));
    }
    
    filtered.sort((a, b) => {
        const idA = extractIdFromUrl(a.url); const idB = extractIdFromUrl(b.url);
        if (sortBy === 'id-asc') return idA - idB; if (sortBy === 'id-desc') return idB - idA;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return b.name.localeCompare(a.name);
    });

    const itemsPerPage = 20;
    const totalPages = isShowingMyTeam ? Math.ceil(myTeam.length / itemsPerPage) : Math.ceil(filtered.length / itemsPerPage);
    const currentList = isShowingMyTeam ? 
        [...myTeam].sort((a, b) => {
            if (sortBy === 'id-asc') return a.id - b.id; if (sortBy === 'id-desc') return b.id - a.id;
            if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
            return b.name.localeCompare(a.name);
        }).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) :
        filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div style={{ 
            minHeight: '100vh', position: 'absolute', overflow: 'hidden',top: 0, left: 0,width: '100vw',
            background: '#0f172a', padding: '40px 20px',
            fontFamily: "'Prompt', sans-serif", color: '#fff'
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;800;900&display=swap');

                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float1 {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(50px, -50px) scale(1.1); }
                    66% { transform: translate(-30px, 30px) scale(0.9); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                @keyframes float2 {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-50px, 50px) scale(1.2); }
                    66% { transform: translate(30px, -30px) scale(0.8); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                .pokeball {
                    width: 50px; 
                    height: 50px;
                    background: linear-gradient(to bottom, #ef4444 46%, #1e293b 46%,#1e293b 54%, #f8fafc 54%); 
                    border-radius: 50%; 
                    position: relative;
                    animation: bouncePokeball 0.5s infinite alternate cubic-bezier(0.5, 0.05, 1, 0.5);
                    margin: 0 auto;
                }
                ::-webkit-scrollbar {
                    display: none; 
                }
                .pokeball::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 12px;
                    height: 12px;
                    background: #f8fafc; border: 3px solid #1e293b;
                    border-radius: 50%;
                }
                .pokeball-shadow {
                    width: 30px; height: 6px; background: rgba(0,0,0,0.4); 
                    border-radius: 50%; margin: 15px auto 0;
                    animation: scaleShadow 0.5s infinite alternate cubic-bezier(0.5, 0.05, 1, 0.5);
                    }
                @keyframes bouncePokeball {
                    from { transform: translateY(0); }
                    to { transform: translateY(-35px); }
                }
                @keyframes scaleShadow {
                    from { transform: scale(1);  opacity: 0.6; }
                    to { transform: scale(0.4); opacity: 0.1; }
                }
                    html, body {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>

            <div style={{ 
                position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', 
                background: bgBlob1, /*  ใช้ตัวแปรสีที่ 1 */
                filter: 'blur(150px)', opacity: 0.4, borderRadius: '50%', 
                animation: 'float1 10s infinite ease-in-out',
                transition: 'background 1.5s ease' /*  สั่งให้เวลาเปลี่ยนสี ค่อยๆ เฟดใช้เวลา 1.5 วินาที */
            }}>
            </div>
            <div style={{ 
                position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', 
                background: bgBlob2, /*  ใช้ตัวแปรสีที่ 2 */
                filter: 'blur(150px)', opacity: 0.4, borderRadius: '50%', 
                animation: 'float2 12s infinite ease-in-out',
                transition: 'background 1.5s ease' /*  สั่งให้ค่อยๆ เฟดเช่นกัน */
            }}>                
            </div>

            <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <h1 style={{ 
                    textAlign: 'center', 
                    fontSize: '4rem', /* ขยายให้ใหญ่ขึ้นนิดนึงเพื่อให้เห็นความใสของกระจกชัดๆ */
                    fontWeight: 600, 
                    marginBottom: '40px', 
                    lineHeight: 'normal', 
                    paddingTop: '10px', 
                    letterSpacing: '3px', /* ถ่างตัวหนังสือออกนิดนึงให้ดูหรูหรา */
                    /* 🌟 เอฟเฟกต์ตัวหนังสือกระจก (Glassmorphism Text) */
                    color: 'rgba(0, 0, 0, 0.05)', /* เนื้อในตัวหนังสือโปร่งใสทะลุเห็นพื้นหลัง */
                    WebkitTextStroke: '2px rgba(255, 255, 255, 0.7)', /* เส้นขอบกระจกสะท้อนแสงสีขาว */
                    textShadow: '0 5px 5px rgba(255, 255, 255, 0.1)' /* แสงออร่าสะท้อนใต้กระจก */ 
                }}>
                    My Pokedex
                </h1>

                {/* 🌟 Header Box แบบแผ่นกระจก */}
                <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)',
                    borderRadius: '30px', padding: '30px', marginBottom: '40px',
                    border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex',
                    flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '20px'
                }}>
                    <input
                        type="text" placeholder="ค้นหาชื่อโปเกมอน..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isShowingMyTeam}
                        style={{ padding: '14px 24px', width: '280px', border: 'none', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '16px', outline: 'none', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}
                    />
                    
                    <select 
                        value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                        style={{ padding: '14px', borderRadius: '16px', border: 'none', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', cursor: 'pointer', outline: 'none' }}
                    >
                        <option value="id-asc" style={{background: '#1e293b'}}>เรียง: ID น้อยไปมาก</option>
                        <option value="id-desc" style={{background: '#1e293b'}}>เรียง: ID มากไปน้อย</option>
                        <option value="name-asc" style={{background: '#1e293b'}}>เรียง: ชื่อ A-Z</option>
                        <option value="name-desc" style={{background: '#1e293b'}}>เรียง: ชื่อ Z-A</option>
                    </select>

                    <button
                        onClick={() => { setIsShowingMyTeam(!isShowingMyTeam); setCurrentPage(1); }}
                        style={{ 
                            padding: '14px 28px', borderRadius: '16px', border: 'none', 
                            background: isShowingMyTeam ? 'linear-gradient(45deg, #10b981, #34d399)' : 'linear-gradient(45deg, #f59e0b, #fbbf24)', 
                            color: '#fff', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s'
                        }}
                    >
                        {isShowingMyTeam ? '🌍 สู่ป่ากว้าง' : `🎒 กระเป๋า (${myTeam.length}/6)`}
                    </button>
                </div>

                {!isShowingMyTeam && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '40px' }}>
                            <button 
                                onClick={() => setTypeFilter('all')}
                                style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: typeFilter === 'all' ? '#fff' : 'rgba(255,255,255,0.1)', color: typeFilter === 'all' ? '#000' : '#fff', fontWeight: 'bold', transition: 'all 0.2s' }}
                            >🌐 ทั้งหมด</button>
                            
                            {/* วนลูปสร้างปุ่มจาก typeConfig ที่เรามีอยู่แล้ว */}
                            {Object.keys(typeConfig).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                        background: typeFilter === type ? typeConfig[type].color : 'rgba(255,255,255,0.1)',
                                        color: '#fff', fontWeight: 'bold', textTransform: 'capitalize', transition: 'all 0.2s',
                                        boxShadow: typeFilter === type ? `0 0 15px ${typeConfig[type].color}` : 'none'
                                    }}
                                >
                                    {typeConfig[type].icon} {type}
                                </button>
                            ))}
                        </div>
                    )}

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '100px' }}>
                        <div style={{ width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                        <div className="pokeball"></div>
                        <div className="pokeball-shadow"></div>
                        <p style={{ marginTop: '20px', fontSize: '18px', opacity: 0.8 }}>กำลังเรียกโปเกมอน...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
                            {currentList.map((p, index) => (
                                <div
                                    key={p.name}
                                    style={{
                                        opacity:0,
                                        animation:'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
                                        animationDelay: `${index * 0.05}s`
                                    }}
                                    >
                                <PokemonCard 
                                    key={p.name} 
                                    name={p.name} 
                                    id={isShowingMyTeam ? (p as CaughtPokemon).id : extractIdFromUrl((p as Pokemon).url)} 
                                    onClick={openModal} 
                                />
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', marginTop: '60px' }}>
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                                style={{ padding: '12px 25px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                            > ◀ </button>
                            <span style={{ fontSize: '18px', fontWeight: 600 }}>หน้า {currentPage} จาก {Math.max(totalPages, 1)}</span>
                            <button 
                                onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}
                                style={{ padding: '12px 25px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', opacity: currentPage >= totalPages ? 0.3 : 1 }}
                            > ▶ </button>
                        </div>
                    </>
                )}
            </div>

            {/* 🌟 Modal กระจกฝ้าแบบล้ำๆ */}
            {selectedPokemon && (
                <div onClick={() => setSelectedPokemon(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
                    <div onClick={e => e.stopPropagation()} style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(25px)', borderRadius: '40px', 
                        padding: '40px', width: '100%', maxWidth: '480px', textAlign: 'center', 
                        border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
                        position: 'relative'
                    }}>
                        <button onClick={() => setSelectedPokemon(null)} style={{ position: 'absolute', top: '25px', right: '25px', border: 'none', background: 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                        
                        {isModalLoading ? (
                            <div style={{ padding: '80px 0' }}>
                                <div className="pokeball"></div>
                                <div className="pokeball-shadow"></div>
                                <h3 style={{ marginTop: '30px', color: '#fff' }}>กำลังดึงข้อมูล...</h3>
                            </div>
                        ) : (
                            <>
                                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '30px', padding: '20px', marginBottom: '25px' }}>
                                    <img 
                                        src={isShiny ? (selectedPokemon.sprites?.other?.showdown?.front_shiny || selectedPokemon.sprites?.front_shiny) : (selectedPokemon.sprites?.other?.showdown?.front_default || selectedPokemon.sprites?.front_default)} style={{ width: '160px', height: '160px', objectFit: 'contain' }} alt={selectedPokemon.name} />
                                </div>
                                <h2 style={{ textTransform: 'capitalize', fontSize: '2.5rem', margin: '0 0 10px 0', letterSpacing: '1px',color: '#fff'}}>{selectedPokemon.name}</h2>
                                <p style={{ opacity: 0.6, fontSize: '18px', marginBottom: '15px' }}>#{selectedPokemon.id.toString().padStart(3, '0')}</p>
                                <button 
                                        onClick={() => setIsShiny(!isShiny)}
                                        style={{
                                            background: isShiny ? 'linear-gradient(45deg, #f59e0b, #fbbf24)' : 'rgba(255,255,255,0.15)',
                                            border: '1px solid rgba(255,255,255,0.2)', 
                                            borderRadius: '20px', 
                                            padding: '8px 25px',        
                                            color: isShiny ? '#000' : '#fff',
                                            cursor: 'pointer', 
                                            fontWeight: 'bold', 
                                            fontSize: '14px', 
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                            transition: 'all 0.3s',
                                            marginBottom: '20px'
                                        }}
                                        >
                                        ✨ {isShiny ? 'ร่างปกติ' : 'ร่างไชน์นี่'}
                                </button>
                                <button onClick={toggleCatch} style={{ 
                                    width: '100%', padding: '18px', borderRadius: '20px', border: 'none', 
                                    background: myTeam.some(p => p.id === selectedPokemon.id) ? 'linear-gradient(45deg, #ef4444, #f87171)' : 'linear-gradient(45deg, #3b82f6, #60a5fa)', 
                                    color: '#fff', fontWeight: 800, fontSize: '18px', cursor: 'pointer', marginBottom: '30px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                }}>
                                    {myTeam.some(p => p.id === selectedPokemon.id) ? '💔 ปล่อยโปเกมอน' : '🔴 จับโปเกมอน'}
                                </button>

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '30px' }}>
                                    {selectedPokemon.types?.map((t, i) => {
                                        const cfg = typeConfig[t.type.name] || { color: '#ffffff', icon: '' };
                                        return <span key={i} style={{ background: cfg.color, padding: '8px 18px', borderRadius: '14px', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>{cfg.icon} {t.type.name}</span>
                                    })}
                                </div>

                                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '25px', borderRadius: '24px', textAlign: 'left' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                                        <div><p style={{ margin: 0, opacity: 0.5, fontSize: '12px' }}>ส่วนสูง</p><strong>{selectedPokemon.height / 10} m</strong></div>
                                        <div><p style={{ margin: 0, opacity: 0.5, fontSize: '12px' }}>น้ำหนัก</p><strong>{selectedPokemon.weight / 10} kg</strong></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        <svg width="240" height="240" viewBox="0 0 200 200" style={{overflow: 'visible' , margin: '10px auto'}}>
            {/* 1. วาดโครงข่ายเรดาร์ 5 ชั้น */}
            {[1, 0.8, 0.6, 0.4, 0.2].map(scale => (
                <polygon 
                    key={scale}
                    points={[0, 1, 2, 3, 4, 5].map(i => {
                        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                        return `${100 + 70 * scale * Math.cos(angle)},${100 + 70 * scale * Math.sin(angle)}`;
                    }).join(' ')}
                    fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"
                />
            ))}
            
            {/* 2. วาดแกน 6 แฉกจากจุดศูนย์กลาง */}
            {[0, 1, 2, 3, 4, 5].map(i => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                return <line key={i} x1="100" y1="100" x2={100 + 70 * Math.cos(angle)} y2={100 + 70 * Math.sin(angle)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            })}

            {/* 3. วาดพื้นที่สีฟ้า ตามค่าพลังจริงของโปเกมอนตัวนั้น! */}
            <polygon 
                points={selectedPokemon.stats?.map((s, i) => {
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    // เทียบอัตราส่วนค่าพลัง (ให้ 150 เป็นค่าพลังที่เกือบเต็มหลอด)
                    const value = Math.min(s.base_stat / 150, 1); 
                    return `${100 + 70 * value * Math.cos(angle)},${100 + 70 * value * Math.sin(angle)}`;
                }).join(' ')}
                fill="rgba(59, 130, 246, 0.6)" 
                stroke="#60a5fa" 
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }} // ออร่าแสงสีฟ้า
            />

            {/* 4. ใส่ชื่อค่าพลังและตัวเลขไว้ตามมุมต่างๆ */}
            {selectedPokemon.stats?.map((s, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const x = 100 + 90 * Math.cos(angle);
                const y = 100 + 90 * Math.sin(angle);
                
                // ย่อชื่อค่าพลังให้สั้นลงจะได้ไม่เกะกะ
                const statName =    s.stat.name === 'special-attack' ? 'Sp.Atk' : 
                                    s.stat.name === 'special-defense' ? 'Sp.Def' : 
                                    s.stat.name === 'attack' ? 'Atk' : 
                                    s.stat.name === 'defense' ? 'Def' : 
                                    s.stat.name === 'speed' ? 'Spd' : 'HP';

                return (
                    <g key={i}>
                        <text x={x} y={y - 6} fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle" fontWeight="bold">
                            {statName}
                        </text>
                        <text x={x} y={y + 8} fill="#60a5fa" fontSize="12" textAnchor="middle" fontWeight="900">
                            {s.base_stat}
                        </text>
                    </g>
                );
            })}
        </svg>
    </div>
                                </div>
                                {evolutionChain.length > 1 && (
                                    <div style={{ 
                                        background: 'rgba(0, 0, 0, 0.2)', padding: '20px', 
                                        borderRadius: '24px', marginTop: '20px', textAlign: 'center' 
                                    }}>
                                        <h4 style={{ margin: '0 0 15px 0', opacity: 0.8 }}>สายวิวัฒนาการ</h4>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            {evolutionChain.map((evo, index) => (
                                                <div key={evo.id} style={{ display: 'flex', alignItems: 'center' }}>
                                                    {/* โชว์ลูกศรถัดไป (ถ้าไม่ใช่ตัวแรก) */}
                                                    {index > 0 && <span style={{ opacity: 0.5, margin: '0 5px' }}>▶</span>}
                                                    
                                                    {/* รูปโปเกมอนแต่ละร่าง (กดเพื่อเปลี่ยนตัวได้ด้วย!) */}
                                                    <div 
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // กันไม่ให้ปิด Modal
                                                            openModal(evo.id); // โหลดตัวใหม่เลย
                                                        }}
                                                        style={{ 
                                                            background: 'rgba(255,255,255,0.1)', borderRadius: '15px', 
                                                            padding: '5px', cursor: 'pointer', transition: 'transform 0.2s',
                                                            border: selectedPokemon.id === evo.id ? '2px solid #3b82f6' : '1px solid transparent'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        <img src={evo.image} alt={evo.name} style={{ width: '60px', height: '60px' }} />
                                                        <p style={{ margin: 0, fontSize: '10px', textTransform: 'capitalize' }}>{evo.name}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Pokedex;