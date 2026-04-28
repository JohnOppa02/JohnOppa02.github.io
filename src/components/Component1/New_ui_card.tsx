import type { FC, MouseEvent } from 'react';

interface PokemonCardProps {
    name: string;
    id: number;
    isInTeam: boolean;
    isPinned: boolean;
    isCompared: boolean;
    compareDisabled: boolean;
    justCaught: boolean;
    onClick: (id: number) => void;
    onCompare: (id: number) => void;
    onPin: (id: number) => void;
}

const PokemonCard: FC<PokemonCardProps> = ({
    name,
    id,
    isInTeam,
    isPinned,
    isCompared,
    compareDisabled,
    justCaught,
    onClick,
    onCompare,
    onPin,
}) => {
    const staticImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

    const handleAction = (event: MouseEvent<HTMLButtonElement>, action: (id: number) => void) => {
        event.stopPropagation();
        action(id);
    };

    return (
        <div
            className={justCaught ? 'pokemon-card pokemon-card--caught' : 'pokemon-card'}
            onClick={() => onClick(id)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick(id);
                }
            }}
            role="button"
            tabIndex={0}
        >
            <span className="pokemon-card__top">
                <span className="pokemon-card__number">#{id.toString().padStart(3, '0')}</span>
                <span className="card-actions">
                    <button
                        aria-label={isPinned ? `Unpin ${name}` : `Pin ${name}`}
                        className={isPinned ? 'card-action card-action--active' : 'card-action'}
                        onClick={(event) => handleAction(event, onPin)}
                        type="button"
                    >
                        Pin
                    </button>
                    <button
                        aria-label={isCompared ? `Remove ${name} from compare` : `Compare ${name}`}
                        className={isCompared ? 'card-action card-action--active' : 'card-action'}
                        disabled={compareDisabled && !isCompared}
                        onClick={(event) => handleAction(event, onCompare)}
                        type="button"
                    >
                        Cmp
                    </button>
                </span>
            </span>
            <span className="pokemon-card__image-wrap">
                <img className="pokemon-card__image" src={staticImageUrl} alt={name} loading="lazy" />
            </span>
            <span className="pokemon-card__name">{name}</span>
            <span className="quick-peek">
                <span>Quick peek</span>
                <strong>{name}</strong>
                <i>#{id.toString().padStart(3, '0')}</i>
                <small>{isInTeam ? 'In your team' : 'Not in team'} · {isPinned ? 'Pinned' : 'Not pinned'} · {isCompared ? 'Comparing' : 'Ready to compare'}</small>
            </span>
        </div>
    );
};

export default PokemonCard;
