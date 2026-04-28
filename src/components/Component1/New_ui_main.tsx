import { Fragment, useEffect, useMemo, useState, type CSSProperties } from 'react';
import PokemonCard from './New_ui_card.tsx';

const typeConfig: Record<string, { color: string }> = {
    normal: { color: '#8b8573' },
    fire: { color: '#c4622d' },
    water: { color: '#3776b8' },
    electric: { color: '#b88a19' },
    grass: { color: '#4f8f4c' },
    ice: { color: '#5a9ca0' },
    fighting: { color: '#a5463a' },
    poison: { color: '#8a4d90' },
    ground: { color: '#9b7a42' },
    flying: { color: '#687da7' },
    psychic: { color: '#b45575' },
    bug: { color: '#788e35' },
    rock: { color: '#8a7a4d' },
    ghost: { color: '#63507b' },
    dragon: { color: '#5b5aa9' },
    dark: { color: '#514941' },
    steel: { color: '#7d8490' },
    fairy: { color: '#b36986' },
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
    stats: { base_stat: number; stat: { name: string } }[];
    sprites: {
        front_default: string;
        front_shiny: string;
        other?: {
            showdown?: { front_default: string; front_shiny: string };
            'official-artwork'?: { front_default: string; front_shiny: string };
        };
    };
}

interface CaughtPokemon {
    id: number;
    name: string;
}

interface EvolutionDetail {
    id: number;
    name: string;
    image: string;
}

interface EvolutionChain {
    species: { name: string; url: string };
    evolves_to: EvolutionChain[];
}

interface TeamPreset {
    id: string;
    name: string;
    team: CaughtPokemon[];
}

const itemsPerPage = 20;
const storage = {
    team: 'myPokemonTeam',
    notes: 'myPokemonNotes',
    presets: 'myPokemonTeamPresets',
    pins: 'myPokemonPinboard',
};

const readStored = <T,>(key: string, fallback: T): T => {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) as T : fallback;
    } catch {
        return fallback;
    }
};

function Pokedex() {
    const [allPokemons, setAllPokemons] = useState<Pokemon[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [typePokemons, setTypePokemons] = useState<string[]>([]);
    const [isShiny, setIsShiny] = useState(false);
    const [evolutionChain, setEvolutionChain] = useState<EvolutionDetail[]>([]);
    const [sortBy, setSortBy] = useState('id-asc');
    const [myTeam, setMyTeam] = useState<CaughtPokemon[]>(() => readStored(storage.team, [] as CaughtPokemon[]));
    const [notes, setNotes] = useState<Record<number, string>>(() => readStored(storage.notes, {} as Record<number, string>));
    const [isShowingMyTeam, setIsShowingMyTeam] = useState(false);
    const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);
    const [compareIds, setCompareIds] = useState<number[]>([]);
    const [compareDetails, setCompareDetails] = useState<PokemonDetail[]>([]);
    const [justCaughtId, setJustCaughtId] = useState<number | null>(null);
    const [teamPresets, setTeamPresets] = useState<TeamPreset[]>(() => readStored(storage.presets, [] as TeamPreset[]));
    const [pinnedIds, setPinnedIds] = useState<number[]>(() => readStored(storage.pins, [] as number[]));
    const [advancedTypeNames, setAdvancedTypeNames] = useState<string[]>([]);
    const [presetName, setPresetName] = useState('');
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [paletteQuery, setPaletteQuery] = useState('');
    const [galleryMode, setGalleryMode] = useState<'artwork' | 'sprite' | 'showdown'>('artwork');
    const [spotlightIndex, setSpotlightIndex] = useState(0);
    const [isSpotlightFading, setIsSpotlightFading] = useState(false);

    const extractIdFromUrl = (url: string) => Number(url.split('/').filter(Boolean).pop() || '0');

    const activeAccent = useMemo(() => {
        if (selectedPokemon?.types?.[0]) {
            return typeConfig[selectedPokemon.types[0].type.name]?.color || '#b88a44';
        }
        if (typeFilter !== 'all') {
            return typeConfig[typeFilter]?.color || '#b88a44';
        }
        return '#b88a44';
    }, [selectedPokemon, typeFilter]);

    useEffect(() => {
        localStorage.setItem(storage.team, JSON.stringify(myTeam));
    }, [myTeam]);

    useEffect(() => {
        localStorage.setItem(storage.notes, JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        localStorage.setItem(storage.presets, JSON.stringify(teamPresets));
    }, [teamPresets]);

    useEffect(() => {
        localStorage.setItem(storage.pins, JSON.stringify(pinnedIds));
    }, [pinnedIds]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setIsPaletteOpen(true);
                return;
            }
            if (event.key === '/' && !isTyping) {
                event.preventDefault();
                setIsPaletteOpen(true);
            }
            if (event.key === 'Escape') {
                setIsPaletteOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetch('https://pokeapi.co/api/v2/pokemon?limit=10000')
            .then((res) => res.json())
            .then((data: { results: Pokemon[] }) => {
                setAllPokemons(data.results);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (typeFilter === 'all') {
            setTypePokemons([]);
            return;
        }

        setIsLoading(true);
        fetch(`https://pokeapi.co/api/v2/type/${typeFilter}`)
            .then((res) => res.json())
            .then((data: { pokemon: { pokemon: Pokemon }[] }) => {
                setTypePokemons(data.pokemon.map((item) => item.pokemon.name));
                setCurrentPage(1);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [typeFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, isShowingMyTeam]);

    useEffect(() => {
        if (compareIds.length === 0) {
            setCompareDetails([]);
            return;
        }

        Promise.all(compareIds.map((id) => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) => res.json() as Promise<PokemonDetail>)))
            .then(setCompareDetails)
            .catch(() => setCompareDetails([]));
    }, [compareIds]);

    useEffect(() => {
        if (!justCaughtId) return;
        const timer = window.setTimeout(() => setJustCaughtId(null), 900);
        return () => window.clearTimeout(timer);
    }, [justCaughtId]);

    useEffect(() => {
        if (allPokemons.length === 0 || isShowingMyTeam) return;
        const pickRandom = () => {
            setIsSpotlightFading(true);
            window.setTimeout(() => {
                setSpotlightIndex((current) => {
                    if (allPokemons.length <= 1) return 0;
                    let next = Math.floor(Math.random() * allPokemons.length);
                    if (next === current) next = (next + 1) % allPokemons.length;
                    return next;
                });
                setIsSpotlightFading(false);
            }, 700);
        };
        pickRandom();
        const timer = window.setInterval(pickRandom, 30000);
        return () => window.clearInterval(timer);
    }, [allPokemons.length, isShowingMyTeam]);

    const advancedSearch = useMemo(() => {
        const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const parsed = {
            text: [] as string[],
            name: '',
            type: '',
            teamOnly: false,
            pinnedOnly: false,
            idOperator: '' as '<' | '>' | '<=' | '>=' | '=',
            idValue: null as number | null,
        };

        tokens.forEach((token) => {
            if (token.startsWith('name:')) parsed.name = token.slice(5);
            else if (token.startsWith('type:')) parsed.type = token.slice(5);
            else if (token === 'team:true') parsed.teamOnly = true;
            else if (token === 'pin:true' || token === 'pinned:true') parsed.pinnedOnly = true;
            else if (token.startsWith('id:')) {
                const raw = token.slice(3);
                const match = raw.match(/^(<=|>=|<|>|=)?(\d+)$/);
                if (match) {
                    parsed.idOperator = (match[1] || '=') as '<' | '>' | '<=' | '>=' | '=';
                    parsed.idValue = Number(match[2]);
                }
            } else {
                parsed.text.push(token);
            }
        });

        return parsed;
    }, [searchTerm]);

    useEffect(() => {
        if (!advancedSearch.type) {
            setAdvancedTypeNames([]);
            return;
        }

        fetch(`https://pokeapi.co/api/v2/type/${advancedSearch.type}`)
            .then((res) => res.json())
            .then((data: { pokemon: { pokemon: Pokemon }[] }) => {
                setAdvancedTypeNames(data.pokemon.map((item) => item.pokemon.name));
            })
            .catch(() => setAdvancedTypeNames([]));
    }, [advancedSearch.type]);

    const openModal = async (id: number) => {
        setIsModalLoading(true);
        setSelectedPokemon({} as PokemonDetail);
        setIsShiny(false);
        setGalleryMode('artwork');
        setEvolutionChain([]);

        try {
            const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const pokemonData = await pokemonRes.json() as PokemonDetail;
            setSelectedPokemon(pokemonData);

            const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
            const speciesData = await speciesRes.json() as { evolution_chain: { url: string } };
            const evolutionRes = await fetch(speciesData.evolution_chain.url);
            const evolutionData = await evolutionRes.json() as { chain: EvolutionChain };

            const evolutions: EvolutionDetail[] = [];
            let currentEvolution: EvolutionChain | undefined = evolutionData.chain;

            while (currentEvolution) {
                const evoId = extractIdFromUrl(currentEvolution.species.url);
                evolutions.push({
                    id: evoId,
                    name: currentEvolution.species.name,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evoId}.png`,
                });
                currentEvolution = currentEvolution.evolves_to[0];
            }

            setEvolutionChain(evolutions);
        } catch (error) {
            console.error('Could not load Pokemon detail:', error);
        } finally {
            setIsModalLoading(false);
        }
    };

    const toggleCatch = () => {
        if (!selectedPokemon) return;

        const isCaught = myTeam.some((pokemon) => pokemon.id === selectedPokemon.id);
        if (isCaught) {
            setMyTeam(myTeam.filter((pokemon) => pokemon.id !== selectedPokemon.id));
            return;
        }

        if (myTeam.length < 6) {
            setMyTeam([...myTeam, { id: selectedPokemon.id, name: selectedPokemon.name }]);
            setJustCaughtId(selectedPokemon.id);
            setIsTeamDrawerOpen(true);
        }
    };

    const removeFromTeam = (id: number) => {
        setMyTeam(myTeam.filter((pokemon) => pokemon.id !== id));
    };

    const savePreset = () => {
        if (myTeam.length === 0) return;
        const name = presetName.trim() || `Team ${teamPresets.length + 1}`;
        setTeamPresets([
            ...teamPresets,
            {
                id: `${Date.now()}`,
                name,
                team: myTeam,
            },
        ]);
        setPresetName('');
    };

    const loadPreset = (preset: TeamPreset) => {
        setMyTeam(preset.team);
        setIsTeamDrawerOpen(false);
    };

    const deletePreset = (id: string) => {
        setTeamPresets(teamPresets.filter((preset) => preset.id !== id));
    };

    const toggleCompare = (id: number) => {
        setCompareIds((current) => {
            if (current.includes(id)) return current.filter((item) => item !== id);
            if (current.length >= 2) return [current[1], id];
            return [...current, id];
        });
    };

    const togglePin = (id: number) => {
        setPinnedIds((current) => {
            const isPinned = current.includes(id);
            return isPinned ? current.filter((item) => item !== id) : [...current, id];
        });
    };

    const filteredPokemons = useMemo(() => {
        const filtered = allPokemons
            .filter((pokemon) => {
                const id = extractIdFromUrl(pokemon.url);
                const name = pokemon.name.toLowerCase();
                const regularText = advancedSearch.text.every((text) => name.includes(text));
                const nameMatch = !advancedSearch.name || name.includes(advancedSearch.name);
                const typeMatch = !advancedSearch.type || advancedTypeNames.includes(pokemon.name);
                const teamMatch = !advancedSearch.teamOnly || myTeam.some((member) => member.id === id);
                const pinMatch = !advancedSearch.pinnedOnly || pinnedIds.includes(id);
                const selectedTypeMatch = typeFilter === 'all' || typePokemons.includes(pokemon.name);

                let idMatch = true;
                if (advancedSearch.idValue !== null) {
                    if (advancedSearch.idOperator === '<') idMatch = id < advancedSearch.idValue;
                    if (advancedSearch.idOperator === '>') idMatch = id > advancedSearch.idValue;
                    if (advancedSearch.idOperator === '<=') idMatch = id <= advancedSearch.idValue;
                    if (advancedSearch.idOperator === '>=') idMatch = id >= advancedSearch.idValue;
                    if (advancedSearch.idOperator === '=') idMatch = id === advancedSearch.idValue;
                }

                return regularText && nameMatch && typeMatch && teamMatch && pinMatch && selectedTypeMatch && idMatch;
            });

        return filtered.sort((a, b) => {
            const idA = extractIdFromUrl(a.url);
            const idB = extractIdFromUrl(b.url);
            if (sortBy === 'id-asc') return idA - idB;
            if (sortBy === 'id-desc') return idB - idA;
            if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
            return b.name.localeCompare(a.name);
        });
    }, [advancedSearch, advancedTypeNames, allPokemons, myTeam, pinnedIds, sortBy, typeFilter, typePokemons]);

    const sortedTeam = useMemo(() => {
        return [...myTeam].sort((a, b) => {
            if (sortBy === 'id-asc') return a.id - b.id;
            if (sortBy === 'id-desc') return b.id - a.id;
            if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
            return b.name.localeCompare(a.name);
        });
    }, [myTeam, sortBy]);

    const clearCompareSide = (id: number) => {
        setCompareIds((current) => current.filter((item) => item !== id));
    };

    const getStatDiff = (pokemon: PokemonDetail, statName: string) => {
        if (compareDetails.length !== 2) return null;
        const other = compareDetails.find((item) => item.id !== pokemon.id);
        const currentStat = pokemon.stats.find((stat) => stat.stat.name === statName)?.base_stat || 0;
        const otherStat = other?.stats.find((stat) => stat.stat.name === statName)?.base_stat || 0;
        return currentStat - otherStat;
    };

    const palettePokemonResults = useMemo(() => {
        const query = paletteQuery.toLowerCase().trim();
        if (!query) return allPokemons.slice(0, 6);
        return allPokemons.filter((pokemon) => pokemon.name.toLowerCase().includes(query)).slice(0, 6);
    }, [allPokemons, paletteQuery]);

    const runPaletteAction = (action: () => void) => {
        action();
        setIsPaletteOpen(false);
        setPaletteQuery('');
    };

    const pinnedPokemons = useMemo(() => {
        return pinnedIds
            .map((id) => {
                const found = allPokemons.find((pokemon) => extractIdFromUrl(pokemon.url) === id);
                return found ? { id, name: found.name } : null;
            })
            .filter((pokemon): pokemon is CaughtPokemon => Boolean(pokemon));
    }, [allPokemons, pinnedIds]);

    const spotlightPokemon = useMemo(() => {
        if (allPokemons.length === 0) return null;
        const pokemon = allPokemons[spotlightIndex % allPokemons.length];
        return {
            id: extractIdFromUrl(pokemon.url),
            name: pokemon.name,
        };
    }, [allPokemons, spotlightIndex]);

    const getDetailImage = (pokemon: PokemonDetail) => {
        if (galleryMode === 'artwork') {
            return isShiny
                ? pokemon.sprites?.other?.['official-artwork']?.front_shiny || pokemon.sprites?.front_shiny
                : pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default;
        }
        if (galleryMode === 'showdown') {
            return isShiny
                ? pokemon.sprites?.other?.showdown?.front_shiny || pokemon.sprites?.front_shiny
                : pokemon.sprites?.other?.showdown?.front_default || pokemon.sprites?.front_default;
        }
        return isShiny ? pokemon.sprites?.front_shiny : pokemon.sprites?.front_default;
    };

    const sourceList = isShowingMyTeam ? sortedTeam : filteredPokemons;
    const totalPages = Math.ceil(sourceList.length / itemsPerPage);
    const currentList = sourceList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const isCaught = selectedPokemon ? myTeam.some((pokemon) => pokemon.id === selectedPokemon.id) : false;
    const canCatch = isCaught || myTeam.length < 6;
    const selectedNote = selectedPokemon ? notes[selectedPokemon.id] || '' : '';
    const renderExpandedDetail = () => {
        if (!selectedPokemon) return null;

        return (
            <article className="detail-rail-card">
                <button className="icon-button" onClick={() => setSelectedPokemon(null)} aria-label="Close detail" type="button">x</button>

                {isModalLoading ? (
                    <div className="loading-state">
                        <div className="loader" />
                        <strong>Loading detail</strong>
                    </div>
                ) : (
                    <>
                        <section className="detail-hero detail-rail-card__hero">
                            <div className="detail-image-wrap detail-image-wrap--premium">
                                <img
                                    className="detail-image"
                                    src={getDetailImage(selectedPokemon)}
                                    alt={selectedPokemon.name}
                                />
                            </div>
                            <div className="gallery-tabs" aria-label="Detail image gallery">
                                {(['artwork', 'sprite', 'showdown'] as const).map((mode) => (
                                    <button className={galleryMode === mode ? 'gallery-tab gallery-tab--active' : 'gallery-tab'} key={mode} onClick={() => setGalleryMode(mode)} type="button">
                                        {mode}
                                    </button>
                                ))}
                            </div>
                            <h2 className="detail-title">{selectedPokemon.name}</h2>
                            <p className="detail-number">#{selectedPokemon.id.toString().padStart(3, '0')}</p>

                            <div className="type-list">
                                {selectedPokemon.types?.map((item) => (
                                    <span className="type-pill" key={item.type.name} style={{ background: typeConfig[item.type.name]?.color || '#171a22' }}>
                                        {item.type.name}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section className="detail-rail-card__body">
                            <div className="detail-actions">
                                <button className="button button--soft" onClick={() => setIsShiny(!isShiny)} type="button">
                                    {isShiny ? 'Default form' : 'Shiny form'}
                                </button>
                                <button className={isCaught ? 'button button--danger' : 'button button--success'} disabled={!canCatch} onClick={toggleCatch} type="button">
                                    {isCaught ? 'Release' : canCatch ? 'Add to team' : 'Team full'}
                                </button>
                                <button className="button button--soft" onClick={() => togglePin(selectedPokemon.id)} type="button">
                                    {pinnedIds.includes(selectedPokemon.id) ? 'Unpin' : 'Pin'}
                                </button>
                                <button className="button button--soft" onClick={() => toggleCompare(selectedPokemon.id)} type="button">
                                    Compare
                                </button>
                            </div>

                            <section className="detail-panel">
                                <div className="metric-row">
                                    <div className="metric"><span>Height</span><strong>{selectedPokemon.height / 10} m</strong></div>
                                    <div className="metric"><span>Weight</span><strong>{selectedPokemon.weight / 10} kg</strong></div>
                                </div>

                                <div className="stats-grid">
                                    {selectedPokemon.stats?.map((stat) => (
                                        <div className="stat-line" key={stat.stat.name}>
                                            <span>{stat.stat.name.replace('special-', 'sp. ')}</span>
                                            <div className="stat-bar"><i style={{ width: `${Math.min((stat.base_stat / 180) * 100, 100)}%` }} /></div>
                                            <strong>{stat.base_stat}</strong>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="detail-panel">
                                <p className="panel-title">Private note</p>
                                <textarea
                                    className="note-field"
                                    placeholder="Write a short note for this Pokemon"
                                    value={selectedNote}
                                    onChange={(event) => setNotes({ ...notes, [selectedPokemon.id]: event.target.value })}
                                />
                            </section>

                            {evolutionChain.length > 1 && (
                                <section className="detail-panel">
                                    <p className="panel-title">Evolution line</p>
                                    <div className="evolution-list">
                                        {evolutionChain.map((evolution) => (
                                            <button className="evolution-card" key={evolution.id} onClick={() => openModal(evolution.id)} type="button">
                                                <img src={evolution.image} alt={evolution.name} />
                                                <span>{evolution.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </section>
                    </>
                )}
            </article>
        );
    };

    return (
        <main className="pokedex-shell" style={{ '--accent': activeAccent } as CSSProperties}>
            <div className="ambient-glow" />
            <div className="pokedex-wrap">
                <header className="pokedex-topbar">
                    <div>
                        <p className="eyebrow">Pokedex</p>
                        <h1 className="pokedex-title">My Pokedex</h1>
                        <p className="pokedex-subtitle">
                            Browse, compare.
                        </p>
                    </div>

                    <button className="team-count" onClick={() => setIsTeamDrawerOpen(true)} type="button" aria-label="Open team drawer">
                        <span className="team-count__value">{myTeam.length}/6</span>
                        <span className="team-count__label">Team slots</span>
                        <span className="slot-row">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <i className={index < myTeam.length ? 'slot slot--filled' : 'slot'} key={index} />
                            ))}
                        </span>
                    </button>
                </header>

                <section className="toolbar" aria-label="Pokedex controls">
                    <input
                        className="field"
                        type="text"
                        placeholder="Search Pokemon"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        disabled={isShowingMyTeam}
                    />

                    <select className="select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                        <option value="id-asc">ID low to high</option>
                        <option value="id-desc">ID high to low</option>
                        <option value="name-asc">Name A to Z</option>
                        <option value="name-desc">Name Z to A</option>
                    </select>

                    <button className="button button--accent" onClick={() => setIsShowingMyTeam(!isShowingMyTeam)} type="button">
                        {isShowingMyTeam ? 'Browse Pokedex' : `View Team (${myTeam.length})`}
                    </button>
                    <button className="button button--soft" onClick={() => setIsTeamDrawerOpen(true)} type="button">
                        Team drawer
                    </button>
                    {/* <button className="button button--soft" onClick={() => setIsPaletteOpen(true)} type="button">
                        Ctrl K
                    </button> */}
                </section>

                {spotlightPokemon && !isShowingMyTeam && (
                    <section className={isSpotlightFading ? 'spotlight-panel spotlight-panel--fading' : 'spotlight-panel'} aria-label="Spotlight Pokemon">
                        <div>
                            <p className="panel-title">Spotlight mode</p>
                            <h2>{spotlightPokemon.name}</h2>
                            <span>refreshes every 30 seconds</span>
                            <div className="spotlight-actions">
                                <button className="button button--accent" onClick={() => openModal(spotlightPokemon.id)} type="button">Open detail</button>
                                <button className="button button--soft" onClick={() => togglePin(spotlightPokemon.id)} type="button">
                                    {pinnedIds.includes(spotlightPokemon.id) ? 'Unpin' : 'Pin'}
                                </button>
                                <button className="button button--soft" onClick={() => toggleCompare(spotlightPokemon.id)} type="button">Compare</button>
                            </div>
                        </div>
                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${spotlightPokemon.id}.png`} alt={spotlightPokemon.name} />
                    </section>
                )}

                {!isShowingMyTeam && (
                    <nav className="type-bar" aria-label="Pokemon type filters">
                        <button className={typeFilter === 'all' ? 'chip chip--active' : 'chip'} onClick={() => setTypeFilter('all')} type="button">
                            All
                        </button>
                        {Object.keys(typeConfig).map((type, index) => (
                            <button
                                className={typeFilter === type ? 'chip chip--active' : 'chip'}
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                style={typeFilter === type ? { background: typeConfig[type].color, borderColor: typeConfig[type].color } : undefined}
                                data-index={index + 1}
                                type="button"
                            >
                                {type}
                            </button>
                        ))}
                    </nav>
                )}

                <section className="search-guide" aria-label="Advanced search guide">
                    <span>Advanced search:</span>
                    <button onClick={() => setSearchTerm('type:fire id:<100')} type="button">type:fire id:&lt;100</button>
                    <button onClick={() => setSearchTerm('team:true')} type="button">team:true</button>
                    <button onClick={() => setSearchTerm('pinned:true')} type="button">pinned:true</button>
                    <button onClick={() => setSearchTerm('name:pika')} type="button">name:pika</button>
                </section>

                {pinnedPokemons.length > 0 && (
                    <section className="pinboard" aria-label="Pokemon pinboard">
                        <div className="pinboard-head">
                            <div>
                                <p className="panel-title">Pokemon pinboard</p>
                                <strong>{pinnedPokemons.length} pinned</strong>
                            </div>
                            <button className="button button--soft" onClick={() => setPinnedIds([])} type="button">Clear pins</button>
                        </div>
                        <div className="pin-row">
                            {pinnedPokemons.map((pokemon) => (
                                <article className="pin-card" key={pokemon.id}>
                                    <button onClick={() => openModal(pokemon.id)} type="button">
                                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`} alt={pokemon.name} />
                                        <strong>{pokemon.name}</strong>
                                        <span>#{pokemon.id.toString().padStart(3, '0')}</span>
                                    </button>
                                    <button onClick={() => togglePin(pokemon.id)} type="button">Remove</button>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {compareIds.length > 0 && (
                    <section className="compare-panel">
                        <div className="compare-head">
                            <div>
                                <p className="panel-title">Compare mode</p>
                                <strong>{compareIds.length}/2 selected</strong>
                            </div>
                            <button className="button button--soft" onClick={() => setCompareIds([])} type="button">Clear</button>
                        </div>
                        <div className="compare-grid">
                            {compareDetails.map((pokemon) => (
                                <article className="compare-card" key={pokemon.id}>
                                    <button className="compare-clear" onClick={() => clearCompareSide(pokemon.id)} type="button">Clear</button>
                                    <img src={pokemon.sprites.front_default} alt={pokemon.name} />
                                    <h3>{pokemon.name}</h3>
                                    {pokemon.stats.slice(0, 6).map((stat) => (
                                        <div className="mini-stat" key={stat.stat.name}>
                                            <span>{stat.stat.name.replace('special-', 'sp. ')}</span>
                                            <strong>{stat.base_stat}</strong>
                                            {getStatDiff(pokemon, stat.stat.name) !== null && (
                                                <em className={(getStatDiff(pokemon, stat.stat.name) || 0) >= 0 ? 'diff diff--up' : 'diff diff--down'}>
                                                    {(getStatDiff(pokemon, stat.stat.name) || 0) > 0 ? '+' : ''}{getStatDiff(pokemon, stat.stat.name)}
                                                </em>
                                            )}
                                        </div>
                                    ))}
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {isLoading ? (
                    <section className="pokemon-grid" aria-label="Loading Pokemon cards">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div className="skeleton-card" key={index} />
                        ))}
                    </section>
                ) : (
                    <>
                        <section className="results-meta" aria-live="polite">
                            <span>{isShowingMyTeam ? 'Your curated team' : `${filteredPokemons.length.toLocaleString()} Pokemon found`}</span>
                            <span>Page {currentPage} of {Math.max(totalPages, 1)}</span>
                        </section>

                        <section className={selectedPokemon ? 'results-layout results-layout--with-detail' : 'results-layout'}>
                            <div className="pokemon-grid">
                            {currentList.length === 0 ? (
                                <div className="empty-state">
                                    <strong>No Pokemon found</strong>
                                    <p>Try another search term or filter.</p>
                                </div>
                            ) : (
                                currentList.map((pokemon, index) => {
                                    const id = isShowingMyTeam ? (pokemon as CaughtPokemon).id : extractIdFromUrl((pokemon as Pokemon).url);
                                    return (
                                        <Fragment key={pokemon.name}>
                                            <div className="result-item" style={{ animationDelay: `${index * 42}ms` }}>
                                                <PokemonCard
                                                    name={pokemon.name}
                                                    id={id}
                                                    isInTeam={myTeam.some((member) => member.id === id)}
                                                    isPinned={pinnedIds.includes(id)}
                                                    isCompared={compareIds.includes(id)}
                                                    compareDisabled={compareIds.length >= 2}
                                                    justCaught={justCaughtId === id}
                                                    onClick={openModal}
                                                    onCompare={toggleCompare}
                                                    onPin={togglePin}
                                                />
                                            </div>
                                        </Fragment>
                                    );
                                })
                            )}
                            </div>
                            {selectedPokemon && (
                                <aside className="detail-rail" aria-label="Selected Pokemon detail">
                                    {renderExpandedDetail()}
                                </aside>
                            )}
                        </section>

                        <div className="pagination">
                            <button className="button button--soft" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} type="button">
                                Prev
                            </button>
                            <span className="page-status">{currentPage} / {Math.max(totalPages, 1)}</span>
                            <button className="button button--soft" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)} type="button">
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>

            {isTeamDrawerOpen && (
                <aside className="drawer-backdrop" onClick={() => setIsTeamDrawerOpen(false)}>
                    <section className="team-drawer" onClick={(event) => event.stopPropagation()} aria-label="Team drawer">
                        <button className="icon-button" onClick={() => setIsTeamDrawerOpen(false)} type="button" aria-label="Close team drawer">x</button>
                        <p className="panel-title">Team drawer</p>
                        <h2>Your six-slot team</h2>
                        <div className="preset-box">
                            <p className="panel-title">Team presets</p>
                            <div className="preset-save">
                                <input
                                    className="field"
                                    value={presetName}
                                    onChange={(event) => setPresetName(event.target.value)}
                                    placeholder="Preset name"
                                />
                                <button className="button button--accent" disabled={myTeam.length === 0} onClick={savePreset} type="button">Save</button>
                            </div>
                            <div className="preset-list">
                                {teamPresets.length === 0 ? (
                                    <span className="preset-empty">No saved presets yet</span>
                                ) : (
                                    teamPresets.map((preset) => (
                                        <article className="preset-item" key={preset.id}>
                                            <button onClick={() => loadPreset(preset)} type="button">
                                                <strong>{preset.name}</strong>
                                                <span>{preset.team.length}/6 Pokemon</span>
                                            </button>
                                            <button onClick={() => deletePreset(preset.id)} type="button">Delete</button>
                                        </article>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="team-list">
                            {Array.from({ length: 6 }).map((_, index) => {
                                const member = myTeam[index];
                                return member ? (
                                    <article className={justCaughtId === member.id ? 'team-member team-member--new' : 'team-member'} key={member.id}>
                                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.id}.png`} alt={member.name} />
                                        <div>
                                            <strong>{member.name}</strong>
                                            <span>#{member.id.toString().padStart(3, '0')}</span>
                                        </div>
                                        <button onClick={() => removeFromTeam(member.id)} type="button">Remove</button>
                                    </article>
                                ) : (
                                    <article className="team-member team-member--empty" key={index}>Empty slot</article>
                                );
                            })}
                        </div>
                    </section>
                </aside>
            )}

            {isPaletteOpen && (
                <div className="palette-backdrop" onClick={() => setIsPaletteOpen(false)}>
                    <section className="command-palette" onClick={(event) => event.stopPropagation()} aria-label="Command palette">
                        <input
                            autoFocus
                            className="palette-input"
                            value={paletteQuery}
                            onChange={(event) => setPaletteQuery(event.target.value)}
                            placeholder="Search Pokemon or run a command"
                        />
                        <div className="palette-section">
                            <p className="panel-title">Commands</p>
                            <button onClick={() => runPaletteAction(() => setIsTeamDrawerOpen(true))} type="button">Open team drawer</button>
                            <button onClick={() => runPaletteAction(() => setIsShowingMyTeam(true))} type="button">Show current team</button>
                            <button onClick={() => runPaletteAction(() => setIsShowingMyTeam(false))} type="button">Browse Pokedex</button>
                            <button onClick={() => runPaletteAction(() => setCompareIds([]))} type="button">Clear compare</button>
                        </div>
                        <div className="palette-section">
                            <p className="panel-title">Pokemon</p>
                            {palettePokemonResults.map((pokemon) => {
                                const id = extractIdFromUrl(pokemon.url);
                                return (
                                    <button key={pokemon.name} onClick={() => runPaletteAction(() => openModal(id))} type="button">
                                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} alt="" />
                                        <span>{pokemon.name}</span>
                                        <i>#{id.toString().padStart(3, '0')}</i>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

export default Pokedex;
