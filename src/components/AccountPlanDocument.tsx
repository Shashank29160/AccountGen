import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, FileText, BarChart3 } from 'lucide-react';
import { CompanyData } from '@/services/companyResearchService';
import { Button } from './ui/button';
import { RiskAnalysisChart } from './RiskAnalysisChart';

interface AccountPlanDocumentProps {
  companyData: CompanyData | null;
  onEdit: (section: string, newContent: string) => void;
}

interface SectionProps {
  title: string;
  content: string | string[];
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (newContent: string) => void;
}

const EditableSection = ({ title, content, isOpen, onToggle, onEdit }: SectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(
    Array.isArray(content) ? content.join('\n• ') : content
  );

  const handleSave = () => {
    onEdit(editedContent);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-border last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          {title}
        </h3>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-4"
        >
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[100px] p-3 bg-muted rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">Save</Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground space-y-2">
              {Array.isArray(content) ? (
                <ul className="list-disc list-inside space-y-1">
                  {content.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="leading-relaxed">{content}</p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export const AccountPlanDocument = ({ companyData, onEdit }: AccountPlanDocumentProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    executive: true,
    financial: true,
    decision: false,
    strategic: false,
    risks: false,
    analysis: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!companyData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FileText className="h-24 w-24 text-muted-foreground/30 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold mb-2">No Account Plan Yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start a company research in the chat to generate a structured account plan here.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col"
    >
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold">{companyData.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">Account Plan Document</p>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <EditableSection
          title="Executive Summary"
          content={companyData.executiveSummary}
          isOpen={openSections.executive}
          onToggle={() => toggleSection('executive')}
          onEdit={(content) => onEdit('executiveSummary', content)}
        />
        
        <EditableSection
          title="Financial Performance"
          content={companyData.financialPerformance}
          isOpen={openSections.financial}
          onToggle={() => toggleSection('financial')}
          onEdit={(content) => onEdit('financialPerformance', content)}
        />
        
        <EditableSection
          title="Key Decision Makers"
          content={companyData.keyDecisionMakers}
          isOpen={openSections.decision}
          onToggle={() => toggleSection('decision')}
          onEdit={(content) => onEdit('keyDecisionMakers', content)}
        />
        
        <EditableSection
          title="Strategic Goals"
          content={companyData.strategicGoals}
          isOpen={openSections.strategic}
          onToggle={() => toggleSection('strategic')}
          onEdit={(content) => onEdit('strategicGoals', content)}
        />
        
        <EditableSection
          title="Risks & Opportunities"
          content={[
            ...companyData.risksOpportunities.risks.map(r => `⚠️ ${r}`),
            ...companyData.risksOpportunities.opportunities.map(o => `✨ ${o}`)
          ]}
          isOpen={openSections.risks}
          onToggle={() => toggleSection('risks')}
          onEdit={(content) => onEdit('risksOpportunities', content)}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-b border-border last:border-b-0"
        >
          <button
            onClick={() => toggleSection('analysis')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {openSections.analysis ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              <BarChart3 className="h-5 w-5 text-primary" />
              Risk & Opportunity Analysis
            </h3>
            <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              Visual Analytics
            </div>
          </button>
          
          {openSections.analysis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4"
            >
              <RiskAnalysisChart companyData={companyData} />
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
