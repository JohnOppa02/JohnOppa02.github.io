import { useState, useEffect } from 'react';
import PokemonCard from './PokemonCard';

    const typeConfig: { [key: string]: { color: string; icon: string } } = {
        normal: { color: '#A8A77A', icon: '🐾' },
        fire: { color: '#EE8130', icon: '🔥' },
        water: { color: '#6390F0', icon: '💧' },
        electric: { color: '#F7D02C', icon: '⚡' },
        grass: { color: '#7AC74C', icon: '🌿' },
        ice: { color: '#96D9D6', icon: '❄️' },
        fighting: { color: '#C22E28', icon: '🥊' },
        poison: { color: '#A33EA1', icon: '☠️' },
        ground: { color: '#E2BF65', icon: '🏜️' },
        flying: { color: '#A98FF3', icon: '🌪️' },
        psychic: { color: '#F95587', icon: '🔮' },
        bug: { color: '#A6B91A', icon: '🐛' },
        rock: { color: '#B6A136', icon: '🪨' },
        ghost: { color: '#735797', icon: '👻' },
        dragon: { color: '#6F35FC', icon: '🐉' },
        dark: { color: '#705746', icon: '🌙' },
        steel: { color: '#B7B7CE', icon: '⚙️' },
        fairy: { color: '#D685AD', icon: '✨' },
    };

    interface Pokemon {
        name: string;
        url: string;
    }

    interface PokemonDetail {
        id: number;
        name: string;
        height: number;
        weight: number;
        types: { type: { name: string } }[];
        stats: { base_stat: number, stat: { name: string } }[];
        sprites: { front_default: string;
            other?: {
                showdown: {
                    front_default: string;
                }
            }
        };
    }

    interface CaughtPokemon {
        id: number;
        name: string;
    }

    function Pokedex() {
        const [pokemons, setPokemons] = useState<Pokemon[]>([]);
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [nextURL, setNextURL] = useState<string | null>(null);
        const [prevUrl, setPrevURL] = useState<string | null>(null);
        const [searchTerm, setSearchTerm] = useState<string>('');
        const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);
        const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
        const [sortBy, setSortBy] = useState<string>('id-asc');
        const [myTeam, setMyTeam] = useState<CaughtPokemon[]>(() => {
            const savedData = localStorage.getItem('myPokemonTeam');
            return savedData ? JSON.parse(savedData) : [];
        });
        const [isShowingMyTeam, setIsShowingMyTeam] = useState<boolean>(false);
        useEffect(() => {
            localStorage.setItem('myPokemonTeam', JSON.stringify(myTeam));
        }, [myTeam]);
        const fetchPokemons = (url: string) => {
            setIsLoading(true);
            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    setPokemons(data.results);
                    setNextURL(data.next);
                    setPrevURL(data.previous);
                    setIsLoading(false);
                })
                .catch((error) => console.error("เกิดข้อผิดพลาด:", error));
        };
        
    useEffect(() => {
        if (searchTerm.trim() === '') {
            fetchPokemons('https://pokeapi.co/api/v2/pokemon?limit=20');
            return;
        }
    
    const delaySearch = setTimeout(() => {
        setIsLoading(true);
        fetch(`https://pokeapi.co/api/v2/pokemon?limit=1000`)
            .then((response) => response.json())
            .then((data) => {
                const filtered = data.results.filter((pokemon: Pokemon) =>
                    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                if (filtered.length === 0) {
                    setPokemons([]);
                    setIsLoading(false);
                    return;
                }
                setPokemons(filtered.slice(0, 20));
                setNextURL(null);
                setPrevURL(null);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error("เกิดข้อผิดพลาด:", error);
                setIsLoading(false);
        });
    }, 500);

    return () => clearTimeout(delaySearch);
}, [searchTerm]);
    

    const extractIdFromUrl = (url: string) => {
    const parts = url.split('/');
    return parseInt(parts[parts.length - 2]);
    }

    const openModal = (id: number) => {
        setIsModalLoading(true);
        setSelectedPokemon({} as PokemonDetail);

        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
            .then((response) => response.json())
            .then((data) => {
                setSelectedPokemon(data);
                setIsModalLoading(false);
            })
            .catch((error) => {
                console.error("เกิดข้อผิดพลาด:", error);
                setIsModalLoading(false);
            });
    };

    const closeModal = () => {
        setSelectedPokemon(null);
    }

    const toggleCatch = () => {
        if (!selectedPokemon) return;
        const isCaught = myTeam.some(p => p.id === selectedPokemon.id);
        if (isCaught) {
            setMyTeam(myTeam.filter(p => p.id !== selectedPokemon.id));
        } else {
            const newCaughtPokemon = { id: selectedPokemon.id, name: selectedPokemon.name };
            setMyTeam([...myTeam, newCaughtPokemon]);
        }}
    
    const getSortedPokemons = (list: Pokemon[]) => {
        // คัดลอก Array ออกมาก่อน (เพื่อไม่ให้กระทบข้อมูลต้นฉบับ) แล้วค่อยใช้ .sort()
        return [...list].sort((a, b) => {
            const idA = extractIdFromUrl(a.url);
            const idB = extractIdFromUrl(b.url);

            if (sortBy === 'id-asc') return idA - idB;                 // ID น้อยไปมาก
            if (sortBy === 'id-desc') return idB - idA;                 // ID มากไปน้อย
            if (sortBy === 'name-asc') return a.name.localeCompare(b.name);  // ชื่อ A-Z
            if (sortBy === 'name-desc') return b.name.localeCompare(a.name); // ชื่อ Z-A
            return 0;
        });
    };

    const getSortedTeam = (list: CaughtPokemon[]) => {
        return [...list].sort((a, b) => {
            if (sortBy === 'id-asc') return a.id - b.id;
            if (sortBy === 'id-desc') return b.id - a.id;
            if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
            if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
            return 0;
        });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <h1 style={{ textAlign: 'center', color: '#E3350D' }}>🔴 My Pokedex By ISUSJohn</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search for a Pokémon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isShowingMyTeam}
                    style={{padding: '10px',width: '300px', fontSize: '16px',borderRadius: '5px', border: '1px solid #ccc',
                        backgroundColor: isShowingMyTeam ? '#eee' : 'white'}}/>
                
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer' }}
                >
                    <option value="id-asc">เรียงตาม ID (น้อยไปมาก)</option>
                    <option value="id-desc">เรียงตาม ID (มากไปน้อย)</option>
                    <option value="name-asc">เรียงตามชื่อ (A-Z)</option>
                    <option value="name-desc">เรียงตามชื่อ (Z-A)</option>
                </select>

                
                <button
                    onClick={() => setIsShowingMyTeam(!isShowingMyTeam)}
                    style={{padding: '10px 20px', fontSize: '16px', borderRadius: '5px', border: 'none',
                        backgroundColor: isShowingMyTeam ? '#28a745' : '#ffc107',
                        color: isShowingMyTeam ? 'white' : '#333', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    {isShowingMyTeam ? '🌍 กลับไปป่า (Pokedex)' : `🎒 กระเป๋าของฉัน (${myTeam.length}/6)`}
                </button>
            </div>

                {isLoading && !isShowingMyTeam? (
                    <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</h2>
                ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '50px' }}>

                    {isShowingMyTeam ? (
                        myTeam.length === 0 ? (
                            <h3 style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#888' }}>
                                คุณยังไม่ได้จับโปเกมอนเลยสักตัว! 😢 ลองกลับไปป่าแล้วปาโปเกบอลดูสิ!
                            </h3>
                        ) : (
                            getSortedTeam(myTeam).map((p) => (
                                <PokemonCard key={p.name} name={p.name} id={p.id} onClick={openModal} />
                            ))
                        )
                    ) : (
                        getSortedPokemons(pokemons).map((pokemon) => {
                            const pokemonId = extractIdFromUrl(pokemon.url);
                            return (
                                <PokemonCard key={pokemon.name} name={pokemon.name} id={pokemonId} onClick={openModal} />
                            );
                        })
                    )
                    }
                </div>
                )}

                {!isLoading && !isShowingMyTeam && (
                    <div style={{display: 'flex',justifyContent: 'center',gap: '20px',marginTop: '25px'}}>
                        <button
                            onClick={() => prevUrl && fetchPokemons(prevUrl)}
                            disabled={!prevUrl}
                            style={{
                                padding: '10px 20px', fontSize: '16px', borderRadius: '5px', border: 'none',
                                backgroundColor: prevUrl ? '#6c757d' : '#cccccc',
                                color: 'white', cursor: prevUrl ? 'pointer' : 'not-allowed'
                            }}
                        >
                            prev page
                        </button>
                        <button 
                        onClick={() => nextURL && fetchPokemons(nextURL)}
                        disabled={!nextURL}
                        style={{
                        padding: '15px 20px', fontSize: '16px', borderRadius: '5px', border: 'none',
                        backgroundColor: nextURL ? '#007bff' : '#cccccc',
                        color: 'white', cursor: nextURL ? 'pointer' : 'not-allowed'
                        }}>
                        next page
                        </button>
                    </div>
                )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '25px' }}>    

            
        </div>
        {selectedPokemon && (
            <div
                onClick={closeModal}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000,}}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: 'white',padding: '30px', borderRadius: '15px',
                            width: '90%', maxWidth: '400px', textAlign: 'center', position: 'relative'
                    }}
                >
                    <button
                        onClick={closeModal}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer'
                        }}
                    >
                        X
                    </button>
                    {isModalLoading ? (
                        <h2>Loading...</h2>
                    ) : (
                        <>
                            <img src={selectedPokemon.sprites?.other?.showdown?.front_default || selectedPokemon.sprites?.front_default} 
    alt={selectedPokemon.name} 
    style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
                                <h2 style={{ textTransform: 'capitalize', marginTop: 0 }}>{selectedPokemon.name}</h2>
                                
                                <button
                                    onClick={toggleCatch}
                                    style={{
                                        width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: 'none',
                                        backgroundColor: myTeam.some(p => p.id === selectedPokemon.id) ? '#dc3545' : '#28a745',
                                        color: 'white', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {myTeam.some(p => p.id === selectedPokemon.id) ? 'ปล่อยโปเกมอน' : 'จับโปเกมอน'}
                                </button>

                                <p><strong>ส่วนสูง:</strong> {selectedPokemon.height / 10} m | <strong>น้ำหนัก:</strong> {selectedPokemon.weight / 10} kg</p>
                                
                                <div style={{ marginBottom: '15px',display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                    <strong>ประเภท:</strong> 
                                    {selectedPokemon.types?.map((t, index) => {
                                        const typeInfo = typeConfig[t.type.name] || { color: '#777', icon: '❓' };
                                        return (
                                            <span key={index} style={{
                                                backgroundColor: typeInfo.color,
                                                color: 'white',
                                                padding: '5px 10px',
                                                borderRadius: '15px',
                                                fontSize: '14px',
                                                textTransform: 'capitalize',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                fontWeight: 'bold',
                                            }}>
                                                {typeInfo.icon} {t.type.name}
                                            </span>
                                        )
                                    })}
                                </div>

                            <div style={{ textAlign: 'left', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '10px' }}>
                                    <h4 style={{ marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>ค่าพลังพื้นฐาน</h4>
                                    {selectedPokemon.stats?.map((s, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span style={{ textTransform: 'uppercase', fontSize: '14px', color: '#555' }}>{s.stat.name}</span>
                                            <strong>{s.base_stat}</strong>
                                        </div>
                                    ))}
                                </div>
                        </>
                    )}
                </div>
            </div>
        )}
        </div>

        );

    }

export default Pokedex;