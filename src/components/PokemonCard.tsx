import { useRef, useState, type FC, type MouseEvent } from 'react';


interface PokemonCardProps {
    name: string;
    id: number;
    onClick: (id: number) => void;
}

const PokemonCard: FC<PokemonCardProps> = ({ name, id, onClick }) => {
    const staticImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

const [tiltStyle, setTiltStyle] = useState({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });

const [glareStyle, setGlareStyle] = useState({
        opacity: 0,
        transform: 'translate(-50%, -50%)'
    });

const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top;  
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        setTiltStyle({ 
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
            transition: 'none' 
        });

        setGlareStyle({
            opacity: 1,
            transform: `translate(${x}px, ${y}px)`
        });
    };

    const handleMouseEnter = () => {
        setIsHovered(true); // เปิดไฟ
        setTiltStyle(prev => ({ ...prev, transition: 'none' }));
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setTiltStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transition: 'all 0.5s ease-out'
        });
        setGlareStyle({
            opacity: 0,
            transform: 'translate(50%, 50%)'
        });
    };

    return (
        <div
            ref={cardRef}
            onClick={() => onClick(id)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            style={{ 
                background: isHovered ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)', 
                boxShadow: isHovered ? '0 0 25px rgba(139, 92, 246, 0.4)' : '0 10px 30px rgba(0, 0, 0, 0.1)', 
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px', 
                padding: '24px', 
                textAlign: 'center', 
                border: '1px solid rgba(255, 255, 255, 0.25)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transformStyle: 'preserve-3d',
                transitionProperty: 'background, box-shadow',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease',
                ...tiltStyle
            }}
        >
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '150%', height: '150%',
                background: 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)',
                pointerEvents: 'none', zIndex: 2, transition: 'opacity 0.3s ease',
                ...glareStyle
            }}></div>

            <div style={{ transform: 'translateZ(40px)', zIndex: 1, position: 'relative' }}>
                <div style={{ 
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)', 
                    borderRadius: '15px', 
                    width: '100%', 
                    padding: '20px 0',
                    marginBottom: '15px',
                    borderTop: '1px solid rgba(255,255,255,0.2)',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.3)' 
                }}>
                    <img src={staticImageUrl} alt={name} style={{ width: '90px', height: '90px', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.1))' }} />
                </div>
                <h3 style={{ textTransform: 'capitalize', margin: '0', color: '#fff', fontSize: '1.2rem', letterSpacing: '0.5px' }}>{name}</h3>
                <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                    #{id.toString().padStart(3, '0')}
                </div>
            </div>
        </div>
    );
};

export default PokemonCard;