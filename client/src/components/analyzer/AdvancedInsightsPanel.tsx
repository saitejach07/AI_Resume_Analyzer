import type {
  AdvancedAction,
  AnalyzeResponse,
  GenerateBulletsResponse,
  InsightTab,
  UnwantedBulletsResponse,
} from '../../types/analyzer'

import { ActionTile } from './ActionTile'
import { EmptyInsightState } from './EmptyInsightState'
import { GeneratedBulletsPanel } from './GeneratedBulletsPanel'
import { InsightTabButton } from './InsightTabButton'
import { SkillGroup } from './SkillGroup'
import { UnwantedBulletsPanel } from './UnwantedBulletsPanel'

type AdvancedInsightsPanelProps = {
  result: AnalyzeResponse
  activeTab: InsightTab
  onTabChange: (tab: InsightTab) => void
  canRunAdvancedAction: boolean
  advancedAction: AdvancedAction | null
  advancedError: string
  generatedBullets: GenerateBulletsResponse | null
  unwantedBullets: UnwantedBulletsResponse | null
  onGenerate: () => void
  onFindUnwanted: () => void
  wide: boolean
}

export function AdvancedInsightsPanel({
  result,
  activeTab,
  onTabChange,
  canRunAdvancedAction,
  advancedAction,
  advancedError,
  generatedBullets,
  unwantedBullets,
  onGenerate,
  onFindUnwanted,
  wide,
}: AdvancedInsightsPanelProps) {
  const missingCount = result.match.missingRequired.length + result.match.missingPreferred.length
  const generatedCount = generatedBullets?.suggestedBullets.length ?? 0
  const unwantedCount = unwantedBullets?.unwantedBullets.length ?? 0

  return (
    <section className={`glass-panel depth-panel insight-workbench animate-rise p-5 ${wide ? 'lg:col-span-12' : ''}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Advanced overview</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">Match workspace</h2>
        </div>
        <div className="insight-tabbar" role="tablist" aria-label="Advanced analysis tabs">
          <InsightTabButton
            active={activeTab === 'skills'}
            label="Skills"
            count={missingCount}
            onClick={() => onTabChange('skills')}
          />
          <InsightTabButton
            active={activeTab === 'generated'}
            label="Generated"
            count={generatedCount}
            onClick={() => onTabChange('generated')}
          />
          <InsightTabButton
            active={activeTab === 'cleanup'}
            label="Cleanup"
            count={unwantedCount}
            onClick={() => onTabChange('cleanup')}
          />
        </div>
      </div>

      {advancedError && (
        <div className="mt-4 rounded-lg border border-rose-400/35 bg-rose-950/45 px-4 py-3 text-sm font-medium text-rose-200">
          {advancedError}
        </div>
      )}

      <div className="mt-5">
        {activeTab === 'skills' && (
          <div className={`grid gap-4 ${wide ? 'xl:grid-cols-2' : ''}`}>
            <div className="insight-section">
              <SkillGroup title="Required skills" items={result.jobDescription.requiredSkills} />
            </div>
            <div className="insight-section">
              <SkillGroup title="Preferred skills" items={result.jobDescription.preferredSkills} />
            </div>
            <div className="insight-section">
              <SkillGroup title="Missing required" items={result.match.missingRequired} intent="missing" />
            </div>
            <div className="insight-section">
              <SkillGroup title="Missing preferred" items={result.match.missingPreferred} intent="missing" />
            </div>
            <div className={`action-grid ${wide ? 'xl:col-span-2' : ''}`}>
              <ActionTile
                title="Close missing skills"
                description="Generate targeted bullets that explicitly cover missing required and preferred keywords."
                buttonLabel={advancedAction === 'generate' ? 'Generating...' : 'Generate bullets'}
                disabled={!canRunAdvancedAction}
                onClick={onGenerate}
                tone="success"
              />
              <ActionTile
                title="Clean low-value bullets"
                description="Find work experience bullets that can likely be removed for this JD."
                buttonLabel={advancedAction === 'unwanted' ? 'Reviewing...' : 'Find cleanup items'}
                disabled={!canRunAdvancedAction}
                onClick={onFindUnwanted}
                tone="warning"
              />
            </div>
          </div>
        )}

        {activeTab === 'generated' && (
          <div className="grid gap-4">
            <ActionTile
              title="Generated bullet points"
              description="Suggestions include exact missing keywords and the experience section where each bullet should go."
              buttonLabel={advancedAction === 'generate' ? 'Generating...' : generatedBullets ? 'Regenerate bullets' : 'Generate bullets'}
              disabled={!canRunAdvancedAction}
              onClick={onGenerate}
              tone="success"
            />
            {generatedBullets ? (
              <GeneratedBulletsPanel result={generatedBullets} embedded />
            ) : (
              <EmptyInsightState text="No generated bullets yet. Run the generator to create targeted resume bullets." />
            )}
          </div>
        )}

        {activeTab === 'cleanup' && (
          <div className="grid gap-4">
            <ActionTile
              title="Unwanted bullet review"
              description="Review bullets that appear least useful for the selected JD without reducing ATS alignment."
              buttonLabel={advancedAction === 'unwanted' ? 'Reviewing...' : unwantedBullets ? 'Review again' : 'Find cleanup items'}
              disabled={!canRunAdvancedAction}
              onClick={onFindUnwanted}
              tone="warning"
            />
            {unwantedBullets ? (
              <UnwantedBulletsPanel result={unwantedBullets} embedded />
            ) : (
              <EmptyInsightState text="No cleanup review yet. Run the review to identify low-value work experience bullets." />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
