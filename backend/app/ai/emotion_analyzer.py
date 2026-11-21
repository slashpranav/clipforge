from typing import Dict


def analyze_vocal_dynamics(energy_level: float, pitch_variation: float = 0.5) -> Dict[str, str]:
    """
    Experimental heuristic vocal dynamics helper.
    Labeled as experimental and not a dominant ranking factor.
    """
    if energy_level > 0.8:
        vibe = "high_intensity"
    elif energy_level > 0.5:
        vibe = "moderate_conversational"
    else:
        vibe = "calm_paced"

    return {
        "vibe": vibe,
        "energy_bracket": f"{int(energy_level * 100)}%",
        "experimental_notice": "Vocal dynamics are experimental heuristics, not psychological assertions.",
    }
