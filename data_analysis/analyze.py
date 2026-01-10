import pandas as pd, numpy as np, json, os, matplotlib.pyplot as plt

# Set paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(script_dir, "study_data_2026-01-10.csv")
df = pd.read_csv(path)

def parse_tabs(s):
    try:
        lst=json.loads(s)
        if isinstance(lst,list):
            return lst
    except Exception:
        pass
    return []

df['tabs_list']=df['tabs_visited'].apply(parse_tabs)
df['tabs_count']=df['tabs_list'].apply(len)
df['visited_coach']=df['tabs_list'].apply(lambda l: 'coach' in l)
df['visited_any_tab']=df['tabs_count']>0
df['started_at_dt']=pd.to_datetime(df['started_at'], utc=True, errors='coerce')
df['finished_at_dt']=pd.to_datetime(df['finished_at'], utc=True, errors='coerce')
df['trial_time_sec']=(df['finished_at_dt']-df['started_at_dt']).dt.total_seconds()

# Participant-level dataset
participants=df.groupby('participant_code').first()[[
    'participant_age','participant_gender','participant_education',
    'participant_tech_adaptation','participant_speaking_anxiety','assigned_condition'
]].copy().rename(columns={'assigned_condition':'condition'}).reset_index()

metrics=['suds_pre','suds_post','delta_suds','recording_duration_sec','rerecord_count',
         'review_time_sec','trial_time_sec','audio_played','text_only_used',
         'tabs_count','visited_coach','helpful','felt_in_control']
part_metrics=df.groupby(['participant_code','condition'])[metrics].mean().reset_index()

# Experiment-only text metrics
exp=df[df['condition']=='experiment'].copy()
exp['filler_rate']=exp['filler_count']/exp['word_count']
exp_part_text=exp.groupby('participant_code').agg(
    word_count_mean=('word_count','mean'),
    filler_count_mean=('filler_count','mean'),
    filler_rate_mean=('filler_rate','mean'),
    wpm_mean=('wpm','mean'),
    wpm_n=('wpm', lambda s: s.notna().sum())
).reset_index()

out_dir = os.path.join(script_dir, "study_visualizations_2026-01-10")
os.makedirs(out_dir, exist_ok=True)

def savefig(name):
    fp=os.path.join(out_dir, name)
    plt.tight_layout()
    plt.savefig(fp, dpi=200, bbox_inches='tight')
    plt.close()
    return fp

figs=[]

# 1 Age by condition (participants)
plt.figure(figsize=(7,4))
data=[participants.loc[participants['condition']=='control','participant_age'],
      participants.loc[participants['condition']=='experiment','participant_age']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('Age')
plt.title('Participant age by condition (n=10 per group)')
figs.append(("01_age_by_condition.png", savefig("01_age_by_condition.png")))

# 2 Gender counts by condition
plt.figure(figsize=(7,4))
ct=pd.crosstab(participants['participant_gender'], participants['condition'])
ct=ct.reindex(sorted(ct.index))
x=np.arange(len(ct.index))
w=0.35
plt.bar(x-w/2, ct.get('control', pd.Series(0,index=ct.index)), width=w, label='control')
plt.bar(x+w/2, ct.get('experiment', pd.Series(0,index=ct.index)), width=w, label='experiment')
plt.xticks(x, ct.index, rotation=0)
plt.ylabel('Participants (count)')
plt.title('Gender composition by condition')
plt.legend()
figs.append(("02_gender_by_condition.png", savefig("02_gender_by_condition.png")))

# 3 Education counts by condition
plt.figure(figsize=(8,4))
ct=pd.crosstab(participants['participant_education'], participants['condition'])
ct=ct.reindex(sorted(ct.index))
x=np.arange(len(ct.index))
w=0.35
plt.bar(x-w/2, ct.get('control', pd.Series(0,index=ct.index)), width=w, label='control')
plt.bar(x+w/2, ct.get('experiment', pd.Series(0,index=ct.index)), width=w, label='experiment')
plt.xticks(x, ct.index, rotation=25, ha='right')
plt.ylabel('Participants (count)')
plt.title('Education level by condition')
plt.legend()
figs.append(("03_education_by_condition.png", savefig("03_education_by_condition.png")))

# 4 Tech adaptation by condition (participants)
plt.figure(figsize=(7,4))
pm=participants.merge(part_metrics[['participant_code','condition']], on=['participant_code','condition'], how='inner')
data=[participants.loc[participants['condition']=='control','participant_tech_adaptation'],
      participants.loc[participants['condition']=='experiment','participant_tech_adaptation']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('Tech adaptation (scale)')
plt.title('Tech adaptation by condition (participants)')
figs.append(("04_tech_adaptation_by_condition.png", savefig("04_tech_adaptation_by_condition.png")))

# 5 Trait speaking anxiety by condition (participants)
plt.figure(figsize=(7,4))
data=[participants.loc[participants['condition']=='control','participant_speaking_anxiety'],
      participants.loc[participants['condition']=='experiment','participant_speaking_anxiety']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('Speaking anxiety (trait scale)')
plt.title('Baseline speaking anxiety by condition (participants)')
figs.append(("05_trait_anxiety_by_condition.png", savefig("05_trait_anxiety_by_condition.png")))

# 6 Mean pre-trial SUDS by condition (participant means)
plt.figure(figsize=(7,4))
data=[part_metrics.loc[part_metrics['condition']=='control','suds_pre'],
      part_metrics.loc[part_metrics['condition']=='experiment','suds_pre']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('SUDS (pre)')
plt.title('Average pre-trial SUDS by condition (participant means)')
figs.append(("06_suds_pre_participant_mean.png", savefig("06_suds_pre_participant_mean.png")))

# 7 Mean post-trial SUDS by condition (participant means)
plt.figure(figsize=(7,4))
data=[part_metrics.loc[part_metrics['condition']=='control','suds_post'],
      part_metrics.loc[part_metrics['condition']=='experiment','suds_post']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('SUDS (post)')
plt.title('Average post-trial SUDS by condition (participant means)')
figs.append(("07_suds_post_participant_mean.png", savefig("07_suds_post_participant_mean.png")))

# 8 Delta SUDS by condition (participant means) + jitter points
plt.figure(figsize=(7,4))
vals_c=part_metrics.loc[part_metrics['condition']=='control','delta_suds'].values
vals_e=part_metrics.loc[part_metrics['condition']=='experiment','delta_suds'].values
plt.boxplot([vals_c, vals_e], labels=['control','experiment'], showfliers=True)
# jitter points
rng=np.random.default_rng(0)
plt.scatter(np.ones_like(vals_c)*1 + rng.normal(0,0.04,len(vals_c)), vals_c, s=30, alpha=0.8)
plt.scatter(np.ones_like(vals_e)*2 + rng.normal(0,0.04,len(vals_e)), vals_e, s=30, alpha=0.8)
plt.axhline(0, linewidth=1)
plt.ylabel('ΔSUDS (post - pre)')
plt.title('Average change in SUDS by condition (participant means)')
figs.append(("08_delta_suds_participant_mean.png", savefig("08_delta_suds_participant_mean.png")))

# 9 Delta SUDS across trials (trial-level mean ± SEM)
plt.figure(figsize=(7,4))
for cond in ['control','experiment']:
    sub=df[df['condition']==cond]
    g=sub.groupby('trial_index')['delta_suds']
    mean=g.mean()
    sem=g.std()/np.sqrt(g.count())
    plt.errorbar(mean.index, mean.values, yerr=sem.values, marker='o', linewidth=1.5, label=cond)
plt.axhline(0, linewidth=1)
plt.xticks(sorted(df['trial_index'].unique()))
plt.xlabel('Trial index')
plt.ylabel('ΔSUDS (post - pre)')
plt.title('SUDS change over trials (mean ± SEM across trials)')
plt.legend()
figs.append(("09_delta_suds_over_trials.png", savefig("09_delta_suds_over_trials.png")))

# 10 Recording duration by condition (participant means)
plt.figure(figsize=(7,4))
data=[part_metrics.loc[part_metrics['condition']=='control','recording_duration_sec'],
      part_metrics.loc[part_metrics['condition']=='experiment','recording_duration_sec']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('Seconds')
plt.title('Average recording duration by condition (participant means)')
figs.append(("10_recording_duration_participant_mean.png", savefig("10_recording_duration_participant_mean.png")))

# 11 Review time by condition (participant means)
plt.figure(figsize=(7,4))
data=[part_metrics.loc[part_metrics['condition']=='control','review_time_sec'],
      part_metrics.loc[part_metrics['condition']=='experiment','review_time_sec']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('Seconds')
plt.title('Average review time by condition (participant means)')
figs.append(("11_review_time_participant_mean.png", savefig("11_review_time_participant_mean.png")))

# 12 Total trial time by condition (participant means)
plt.figure(figsize=(7,4))
data=[part_metrics.loc[part_metrics['condition']=='control','trial_time_sec'],
      part_metrics.loc[part_metrics['condition']=='experiment','trial_time_sec']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('Seconds')
plt.title('Average total time per trial by condition (participant means)')
figs.append(("12_trial_time_participant_mean.png", savefig("12_trial_time_participant_mean.png")))

# 13 Re-record count by condition (participant means)
plt.figure(figsize=(7,4))
vals=[part_metrics.loc[part_metrics['condition']=='control','rerecord_count'],
      part_metrics.loc[part_metrics['condition']=='experiment','rerecord_count']]
plt.boxplot(vals, labels=['control','experiment'], showfliers=True)
plt.ylabel('Re-records (average per trial)')
plt.title('Re-record frequency by condition (participant means)')
figs.append(("13_rerecord_count_participant_mean.png", savefig("13_rerecord_count_participant_mean.png")))

# 14 Feature usage rates (participant means)
plt.figure(figsize=(8,4))
rate_cols=[('audio_played','Audio played'),
           ('text_only_used','Text-only mode'),
           ('visited_coach','Coach tab visited')]
x=np.arange(len(rate_cols))
w=0.35
ctrl=part_metrics[part_metrics['condition']=='control']
exp_m=part_metrics[part_metrics['condition']=='experiment']
ctrl_rates=[ctrl[c].mean() for c,_ in rate_cols]
exp_rates=[exp_m[c].mean() for c,_ in rate_cols]
plt.bar(x-w/2, ctrl_rates, width=w, label='control')
plt.bar(x+w/2, exp_rates, width=w, label='experiment')
plt.xticks(x, [lab for _,lab in rate_cols], rotation=15, ha='right')
plt.ylim(0,1)
plt.ylabel('Rate (0–1)')
plt.title('Feature usage rates (participant-level means)')
plt.legend()
figs.append(("14_feature_usage_rates.png", savefig("14_feature_usage_rates.png")))

# 15 Tabs visited count by condition (participant means)
plt.figure(figsize=(7,4))
data=[part_metrics.loc[part_metrics['condition']=='control','tabs_count'],
      part_metrics.loc[part_metrics['condition']=='experiment','tabs_count']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('Tabs visited (average per trial)')
plt.title('Tabs visited by condition (participant means)')
figs.append(("15_tabs_count_participant_mean.png", savefig("15_tabs_count_participant_mean.png")))

# 16 Helpful rating by condition (participant means)
plt.figure(figsize=(7,4))
data=[part_metrics.loc[part_metrics['condition']=='control','helpful'],
      part_metrics.loc[part_metrics['condition']=='experiment','helpful']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('Helpful (rating)')
plt.title('Perceived helpfulness by condition (participant means)')
figs.append(("16_helpful_participant_mean.png", savefig("16_helpful_participant_mean.png")))

# 17 Felt in control rating by condition (participant means)
plt.figure(figsize=(7,4))
data=[part_metrics.loc[part_metrics['condition']=='control','felt_in_control'],
      part_metrics.loc[part_metrics['condition']=='experiment','felt_in_control']]
plt.boxplot(data, labels=['control','experiment'], showfliers=True)
plt.ylabel('Felt in control (rating)')
plt.title('Sense of control by condition (participant means)')
figs.append(("17_felt_in_control_participant_mean.png", savefig("17_felt_in_control_participant_mean.png")))

# 18 Helpful vs Delta SUDS (participant means)
plt.figure(figsize=(6.5,4.5))
for cond in ['control','experiment']:
    sub=part_metrics[part_metrics['condition']==cond]
    plt.scatter(sub['helpful'], sub['delta_suds'], label=cond, s=45, alpha=0.9)
plt.axhline(0, linewidth=1)
plt.xlabel('Helpful (participant mean)')
plt.ylabel('ΔSUDS (participant mean)')
plt.title('Helpfulness vs SUDS change (participant means)')
plt.legend()
figs.append(("18_helpful_vs_delta_suds.png", savefig("18_helpful_vs_delta_suds.png")))

# 19 Felt in control vs Delta SUDS (participant means)
plt.figure(figsize=(6.5,4.5))
for cond in ['control','experiment']:
    sub=part_metrics[part_metrics['condition']==cond]
    plt.scatter(sub['felt_in_control'], sub['delta_suds'], label=cond, s=45, alpha=0.9)
plt.axhline(0, linewidth=1)
plt.xlabel('Felt in control (participant mean)')
plt.ylabel('ΔSUDS (participant mean)')
plt.title('Sense of control vs SUDS change (participant means)')
plt.legend()
figs.append(("19_control_vs_delta_suds.png", savefig("19_control_vs_delta_suds.png")))

# 20 Experiment: word count distribution (per trial)
plt.figure(figsize=(7,4))
vals=exp['word_count'].dropna().values
plt.hist(vals, bins=10)
plt.xlabel('Word count (trial)')
plt.ylabel('Trials (count)')
plt.title('Experiment condition: word count distribution (trials)')
figs.append(("20_experiment_word_count_hist.png", savefig("20_experiment_word_count_hist.png")))

# 21 Experiment: filler rate distribution (per trial)
plt.figure(figsize=(7,4))
vals=exp['filler_rate'].replace([np.inf,-np.inf], np.nan).dropna().values
plt.hist(vals, bins=10)
plt.xlabel('Filler rate (filler_count / word_count)')
plt.ylabel('Trials (count)')
plt.title('Experiment condition: filler rate distribution (trials)')
figs.append(("21_experiment_filler_rate_hist.png", savefig("21_experiment_filler_rate_hist.png")))

# 22 Experiment: word count vs filler rate (per trial)
plt.figure(figsize=(6.5,4.5))
sub=exp[['word_count','filler_rate']].replace([np.inf,-np.inf], np.nan).dropna()
plt.scatter(sub['word_count'], sub['filler_rate'], s=45, alpha=0.9)
plt.xlabel('Word count (trial)')
plt.ylabel('Filler rate')
plt.title('Experiment condition: word count vs filler rate (trials)')
figs.append(("22_experiment_wordcount_vs_fillerrate.png", savefig("22_experiment_wordcount_vs_fillerrate.png")))

# Build a caption table (lightweight)
captions=[
("01_age_by_condition.png","Participant age distribution by condition (n=10 per group). Box = median/IQR; points are outliers."),
("02_gender_by_condition.png","Gender composition by condition (participant counts)."),
("03_education_by_condition.png","Education level composition by condition (participant counts)."),
("04_tech_adaptation_by_condition.png","Self-reported tech adaptation by condition (participants)."),
("05_trait_anxiety_by_condition.png","Baseline speaking-anxiety trait by condition (participants)."),
("06_suds_pre_participant_mean.png","Average pre-trial SUDS per participant, aggregated across 5 trials."),
("07_suds_post_participant_mean.png","Average post-trial SUDS per participant, aggregated across 5 trials."),
("08_delta_suds_participant_mean.png","Average SUDS change (post–pre) per participant; negative values mean anxiety decreased."),
("09_delta_suds_over_trials.png","Mean SUDS change per trial index (trial-level mean ± SEM)."),
("10_recording_duration_participant_mean.png","Average recording duration per participant (seconds), aggregated across trials."),
("11_review_time_participant_mean.png","Average review time per participant (seconds), aggregated across trials."),
("12_trial_time_participant_mean.png","Average total time per trial per participant (seconds), aggregated across trials."),
("13_rerecord_count_participant_mean.png","Average number of re-records per trial per participant."),
("14_feature_usage_rates.png","Feature usage rates computed from participant-level averages (audio played, text-only mode, coach tab)."),
("15_tabs_count_participant_mean.png","Average number of tabs visited per trial (participant means)."),
("16_helpful_participant_mean.png","Perceived helpfulness ratings (participant means)."),
("17_felt_in_control_participant_mean.png","Sense of control ratings (participant means)."),
("18_helpful_vs_delta_suds.png","Relationship between helpfulness and SUDS change (participant means)."),
("19_control_vs_delta_suds.png","Relationship between sense of control and SUDS change (participant means)."),
("20_experiment_word_count_hist.png","Experiment only: distribution of word counts across trials (control has no transcripts)."),
("21_experiment_filler_rate_hist.png","Experiment only: distribution of filler rate across trials."),
("22_experiment_wordcount_vs_fillerrate.png","Experiment only: association between word count and filler rate across trials."),
]
cap_df=pd.DataFrame(captions, columns=["figure","suggested_caption"])
cap_path=os.path.join(out_dir,"figure_captions.csv")
cap_df.to_csv(cap_path, index=False)

# Zip everything
import zipfile
zip_path = os.path.join(script_dir, "study_visualizations_2026-01-10.zip")
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for f in sorted(os.listdir(out_dir)):
        z.write(os.path.join(out_dir,f), arcname=f)

print(f"Analysis complete. Figures saved to {out_dir}")
print(f"Zip file created at {zip_path}")

