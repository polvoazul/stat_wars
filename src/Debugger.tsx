import { Env } from "./env"

export default function Debugger({env}: {env: Env}) {
    function damage_to(player, damage) {
        env.players[player].take_damage(damage)
        env.update_game_state()
    }
    return (
        <div>
            <h1>DEBUG MODE ON!</h1>
            <div>
            <button className="btn btn-danger" onClick={() => damage_to(0, 20)}> Damage p0 </button>
            <button className="btn btn-danger" onClick={() => damage_to(1, 20)}> Damage p1 </button>
            </div>
        </div>
    )
}