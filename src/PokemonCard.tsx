import { type FC } from 'react';


interface PokemonCardProps {
    name: string;
    id: number;
    onClick: (id: number) => void;
}

const PokemonCard: FC<PokemonCardProps> = ({ name, id, onClick }) => {
    const staticImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

    return (
        <div
            onClick={() => onClick(id)}
            style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px', 
                padding: '24px', 
                textAlign: 'center', 
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            }}
        >
            <div style={{ 
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)', 
                borderRadius: '15px', 
                width: '100%', 
                padding: '20px 0',
                marginBottom: '15px',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.3)' // เงาดำด้านในทำให้ดูเป็นหลุมลึกลงไป
            }}>
                <img src={staticImageUrl} alt={name} style={{ width: '90px', height: '90px', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.1))' }} />
            </div>
            <h3 style={{ textTransform: 'capitalize', margin: '0', color: '#fff', fontSize: '1.2rem', letterSpacing: '0.5px' }}>{name}</h3>
            <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
                #{id.toString().padStart(3, '0')}
            </div>
        </div>
    );
};

export default PokemonCard;