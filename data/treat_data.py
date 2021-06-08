import pandas as pd
from itertools import chain
import json

df = pd.read_csv('./data/brasileirao.csv')
df.dropna()
df = df[df.ano_campeonato == 2020]
df.columns = [c.replace('man', 'mandante').replace('vis', 'visitante') for c in df.columns]
df['gols_tomados_mandante'] = df['gols_visitante']
df['gols_tomados_visitante'] = df['gols_mandante']
df['vitorias_mandante'] = df.gols_mandante > df.gols_visitante
df['vitorias_visitante'] = df.gols_mandante < df.gols_visitante
df =  df.sort_values(['ano_campeonato', 'rodada'])

from collections import namedtuple
Stat = namedtuple('Stat', 'agg bigger_is_better kind')

AGGREGATES = {
    'vitorias':                  Stat(agg='sum',  bigger_is_better=True,  kind='any')
    ,'gols':                     Stat(agg='sum',  bigger_is_better=True,  kind='offensive')
    ,'gols_1_tempo':             Stat(agg='sum',  bigger_is_better=True,  kind='offensive')
    ,'gols_tomados':             Stat(agg='sum',  bigger_is_better=False, kind='defensive')
    ,'escanteios':               Stat(agg='sum',  bigger_is_better=True,  kind='offensive')
    ,'faltas':                   Stat(agg='sum',  bigger_is_better=False, kind='defensive')
    ,'defesas':                  Stat(agg='sum',  bigger_is_better=True,  kind='defensive')
    ,'impedimentos':             Stat(agg='sum',  bigger_is_better=False, kind='offensive')
    ,'chutes':                   Stat(agg='sum',  bigger_is_better=True,  kind='offensive')
    ,'chutes_fora':              Stat(agg='sum',  bigger_is_better=False, kind='offensive')
    ,'chutes_bola_parada':       Stat(agg='sum',  bigger_is_better=True,  kind='offensive')
}
AGGREGATES_NON_SPLIT = { # TODO: implement
    'colocacao':                 Stat(agg='last', bigger_is_better=False, kind='any')
    ,'valor_equipe_titular':     Stat(agg='mean', bigger_is_better=True,  kind='any')
    ,'idade_media_titular':      Stat(agg='mean', bigger_is_better=None,  kind='any')
}
OTHERS = {
    'publico_mandante':          Stat(agg=None, bigger_is_better=True,  kind='any')
}

def get_stats_of_type(type_='mandante'):
    stats_p_team = df.groupby(['ano_campeonato', f'time_{type_}']).agg({f'{k}_{type_}': v.agg for k, v in AGGREGATES.items()})
    stats_p_team = stats_p_team[[c for c in stats_p_team.columns if type_ in c]]
    stats_p_team.index.names = ['ano_campeonato', 'time']
    return stats_p_team

def get_publico_mandante():
    out = df.groupby(['ano_campeonato', 'time_mandante']).publico.mean()
    out.index.names = ['ano_campeonato', 'time']
    out.name = 'publico_mandante'
    return out

team_stats = get_stats_of_type('mandante').join(get_stats_of_type('visitante')).join(get_publico_mandante())

for s in AGGREGATES:
    team_stats[s + '_total'] = team_stats[f'{s}_mandante'] + team_stats[f'{s}_visitante']

COLUMNS = ({f'{k}_mandante': v for k, v in AGGREGATES.items()} |
        {f'{k}_visitante': v for k, v in AGGREGATES.items()} |
        {f'{k}_total': v for k, v in AGGREGATES.items()} |
        {k: v for k, v in OTHERS.items()}
)
team_stats = team_stats.rename(columns={k: f'{k}|bigger_is_better={json.dumps(v.bigger_is_better)}|kind={v.kind}' for k, v in COLUMNS.items()})

team_stats.to_csv('data/brasileirao_stats.csv')
team_stats.reset_index().to_json('src/brasileirao_stats.json', orient='records')


#############################
