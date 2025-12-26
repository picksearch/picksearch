import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { X, RotateCcw, Check, Plus, Trash2, Filter, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TARGET_OPTIONS } from "@/components/targetOptions";

export default function TargetSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for target settings
  // Structure: { [category]: { [field]: [values] } }
  // Example: { DEMO: { gender: ['M'], age: ['AGE_20S', 'AGE_30S'] } }
  const [targets, setTargets] = useState({});
  
  // Multi-target (Cell) support
  const [cells, setCells] = useState([
    { id: 'CELL_MAIN', name: '설문 타겟', targets: {} }
  ]);
  const [activeCellId, setActiveCellId] = useState('CELL_MAIN');
  const [surveyType, setSurveyType] = useState('targeted');
  const [draftId, setDraftId] = useState(null);

  useEffect(() => {
    // Load initial data from location state or local storage
    if (location.state?.surveyType) {
      setSurveyType(location.state.surveyType);
    }
    
    if (location.state?.draftId) {
      setDraftId(location.state.draftId);
    }

    if (location.state?.initialTargets) {
      if (Array.isArray(location.state.initialTargets)) {
        setCells(location.state.initialTargets);
        setActiveCellId(location.state.initialTargets[0]?.id || 'CELL_MAIN');
      } else {
        // Legacy format support
        setCells([{ id: 'CELL_MAIN', name: '설문 타겟', targets: location.state.initialTargets }]);
      }
    }
  }, [location.state]);

  const currentCell = cells.find(c => c.id === activeCellId) || cells[0];
  
  const updateCurrentCellTargets = (newTargets) => {
    setCells(cells.map(cell => 
      cell.id === activeCellId ? { ...cell, targets: newTargets } : cell
    ));
  };

  const handleOptionToggle = (category, field, value, type) => {
    const currentTargets = { ...currentCell.targets };
    if (!currentTargets[category]) currentTargets[category] = {};
    
    const currentValues = currentTargets[category][field];

    if (type === 'radio') {
      // Toggle off if already selected, otherwise select
      if (currentValues === value) {
        delete currentTargets[category][field];
      } else {
        currentTargets[category][field] = value;
        
        // APP_USAGE mutual exclusion logic
        if (category === 'APP_USAGE' && field === 'app_category') {
          delete currentTargets[category]['custom_app_text'];
        }
      }
    } else if (type === 'checkbox') {
      const prev = Array.isArray(currentValues) ? currentValues : [];
      if (prev.includes(value)) {
        const next = prev.filter(v => v !== value);
        if (next.length === 0) delete currentTargets[category][field];
        else currentTargets[category][field] = next;
      } else {
        currentTargets[category][field] = [...prev, value];
      }
    }

    // Cleanup empty category objects
    if (Object.keys(currentTargets[category]).length === 0) {
      delete currentTargets[category];
    }

    updateCurrentCellTargets(currentTargets);
  };

  const handleTextChange = (category, field, text) => {
    const currentTargets = { ...currentCell.targets };
    if (!currentTargets[category]) currentTargets[category] = {};
    
    if (text.trim()) {
      currentTargets[category][field] = text;
      
      // APP_USAGE mutual exclusion logic
      if (category === 'APP_USAGE' && field === 'custom_app_text') {
        delete currentTargets[category]['app_category'];
      }
    } else {
      delete currentTargets[category][field];
      if (Object.keys(currentTargets[category]).length === 0) delete currentTargets[category];
    }
    updateCurrentCellTargets(currentTargets);
  };

  const handleReset = () => {
    if (window.confirm("현재 타겟 설정을 초기화하시겠습니까?")) {
      updateCurrentCellTargets({});
    }
  };

  const handleApply = () => {
    // Explicitly navigate back to CreateSurvey with state
    // We include surveyType to prevent the modal from reappearing
    navigate(createPageUrl('CreateSurvey'), { 
      state: { 
        targets: cells, 
        surveyType: surveyType,
        draftId: draftId
      } 
    });
  };

  const handleBack = () => {
    // Navigate back to CreateSurvey, restoring initial targets if available
    // This ensures we don't lose previous settings if the component re-mounts
    // Also explicit navigation fixes issues where history might be empty
    navigate(createPageUrl('CreateSurvey'), { 
      state: { 
        targets: location.state?.initialTargets || null,
        surveyType: surveyType,
        draftId: draftId
      } 
    });
  };

  const handleAddCell = () => {
    const newId = `CELL_VARIANT_${cells.length}`;
    setCells([...cells, { 
      id: newId, 
      name: `타겟 그룹 ${cells.length + 1}`, 
      targets: {} 
    }]);
    setActiveCellId(newId);
  };

  const handleRemoveCell = (e, cellId) => {
    e.stopPropagation();
    if (cells.length <= 1) return;
    if (window.confirm("이 타겟 그룹을 삭제하시겠습니까?")) {
      const newCells = cells.filter(c => c.id !== cellId);
      setCells(newCells);
      if (activeCellId === cellId) {
        setActiveCellId(newCells[0].id);
      }
    }
  };

  // Helper to get summary tags
  const getSummaryTags = () => {
    const tags = [];
    Object.entries(currentCell.targets).forEach(([catKey, fields]) => {
      Object.entries(fields).forEach(([fieldKey, value]) => {
        const catConfig = TARGET_OPTIONS[catKey];
        if (!catConfig) return;
        
        const fieldConfig = catConfig.fields.find(f => f.key === fieldKey);
        if (!fieldConfig) return;

        if (fieldConfig.type === 'text') {
           tags.push({ label: `"${value}"`, category: catConfig.label });
           return;
        }

        if (Array.isArray(value)) {
          value.forEach(v => {
            const opt = fieldConfig.options?.find(o => o.value === v);
            if (opt) tags.push({ label: opt.label, category: catConfig.label });
          });
        } else {
          const opt = fieldConfig.options?.find(o => o.value === value);
          if (opt) tags.push({ label: opt.label, category: catConfig.label });
        }
      });
    });
    return tags;
  };

  const summaryTags = getSummaryTags();

  // Helper to generate description text for a category
  const generateCategoryDescription = (categoryKey) => {
    const categoryTargets = currentCell.targets[categoryKey];
    if (!categoryTargets || Object.keys(categoryTargets).length === 0) return null;

    const getLabels = (fieldKey) => {
      const fieldConfig = TARGET_OPTIONS[categoryKey].fields.find(f => f.key === fieldKey);
      if (!fieldConfig) return [];
      const values = categoryTargets[fieldKey];
      if (!values) return [];
      
      const valueList = Array.isArray(values) ? values : [values];
      return valueList.map(v => {
        if (fieldKey === 'keyword_text') return `"${v}"`;
        return fieldConfig.options?.find(o => o.value === v)?.label || v;
      });
    };

    switch (categoryKey) {
      case 'APP_USAGE': {
        const apps = getLabels('app_category');
        const customApp = currentCell.targets[categoryKey]?.custom_app_text;
        
        let text = "";
        if (apps.length > 0) text += `${apps.join(', ')} 카테고리 앱`;
        
        if (customApp) {
          if (text) text += " 또는 ";
          text += `"${customApp}" 앱`;
        }
        
        if (!text) return "선택된 앱 이용자에게 광고가 보여집니다.";
        return `${text}을(를) 설치/이용하는 회원에게 광고가 보여집니다.`;
      }
      case 'DEMO': {
        const parts = [];
        const ages = getLabels('age_10s');
        const genders = getLabels('gender').filter(g => g !== '전체');
        
        if (ages.length > 0) parts.push(ages.join(', '));
        if (genders.length > 0) parts.push(genders.join('/'));
        
        if (parts.length === 0) return "선택된 인구통계 조건에 해당하는 회원에게 광고가 보여집니다.";
        return `${parts.join(' ')} 회원에게 광고가 보여집니다.`;
      }
      case 'SPENDING': {
        const spending = getLabels('spending_power');
        if (spending.length === 0) return "선택된 소득/소비 여력 조건에 해당하는 회원에게 광고가 보여집니다.";
        return `소득/소비 여력이 ${spending.join(', ')}인 회원에게 광고가 보여집니다.`;
      }
      case 'OCCUPATION': {
        const jobs = getLabels('occupation_type');
        if (jobs.length === 0) return "선택된 직업 조건에 해당하는 회원에게 광고가 보여집니다.";
        return `직업이 ${jobs.join(', ')}인 회원에게 광고가 보여집니다.`;
      }
      case 'MARRIAGE': {
        const status = getLabels('marital_stage');
        if (status.length === 0) return "선택된 결혼/가구 조건에 해당하는 회원에게 광고가 보여집니다.";
        return `${status.join(', ')} 상태인 회원에게 광고가 보여집니다.`;
      }
      case 'LIFECYCLE': {
        const cycle = getLabels('life_stage');
        if (cycle.length === 0) return "선택된 생애주기 조건에 해당하는 회원에게 광고가 보여집니다.";
        return `생애주기가 ${cycle.join(', ')}에 해당하는 회원에게 광고가 보여집니다.`;
      }
      case 'BEHAVIOR': {
        const cats = getLabels('shopping_category');
        
        let text = "";
        if (cats.length > 0) text += `${cats.join(', ')} 관련 상품에 `;
        else text += "쇼핑에 ";
        
        return `${text} 관심/구매 이력이 있는 회원에게 광고가 보여집니다.`;
      }
      case 'INTEREST': {
        const ints = getLabels('interest_category');
        const level = getLabels('interest_level');
        
        let text = "";
        if (ints.length > 0) text += `${ints.join(', ')} 분야에 `;
        else text += "특정 분야에 ";
        
        if (level.length > 0) text += `${level.join(', ')} 관심이 있는 `;
        else text += "관심이 있는 ";
        
        return `${text} 회원에게 광고가 보여집니다.`;
      }
      case 'LOCATION': {
        const regions = getLabels('residence_region');
        
        let text = "";
        if (regions.length > 0) text += `${regions.join(', ')} 지역에 거주하는 `;
        
        if (!text) return "선택된 거주 지역에 해당하는 회원에게 광고가 보여집니다.";
        return `${text} 회원에게 광고가 보여집니다.`;
      }
      default: {
        // Generic fallback
        const allLabels = [];
        Object.keys(categoryTargets).forEach(key => {
          allLabels.push(...getLabels(key));
        });
        if (allLabels.length === 0) return null;
        return `${allLabels.join(', ')} 조건에 해당하는 회원에게 광고가 보여집니다.`;
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - Sticky */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 flex-shrink-0">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-1 -ml-1 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">타겟 설정</h1>
          </div>
          <button onClick={handleBack} className="p-1 -mr-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Cell Tabs (Multi-target support) */}
        <div className="px-4 pb-0 overflow-x-auto flex gap-2 scrollbar-hide border-b border-gray-100">
          {cells.map((cell) => (
            <div
              key={cell.id}
              onClick={() => setActiveCellId(cell.id)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap
                ${activeCellId === cell.id 
                  ? 'border-blue-500 text-blue-600 font-bold' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'}
              `}
            >
              <span>{cell.name}</span>
              {cells.length > 1 && (
                <button 
                  onClick={(e) => handleRemoveCell(e, cell.id)}
                  className="opacity-50 hover:opacity-100 hover:bg-red-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Summary Bar - Collapsible/Scrollable */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 min-h-[60px]">
          {summaryTags.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto">
              {summaryTags.map((tag, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg font-medium shadow-sm"
                >
                  <span className="text-[10px] text-gray-400 mr-1.5">{tag.category}</span>
                  {tag.label}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>선택된 타겟 조건이 없습니다</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Accordion type="multiple" className="space-y-4">
          {(() => {
            // 카테고리 순서 정의
            const categoryOrder = [
              'DEMO', 'INTEREST', 'OCCUPATION', 'SPENDING',
              'BEHAVIOR', 'APP_USAGE', 'LOCATION', 'MEMBERSHIP', 'PAYMENT', 'CONTENT', 'MARRIAGE', 'LIFECYCLE'
            ];
            
            // 정렬된 엔트리 (CUSTOM_APP, CUSTOM_LOCATION 제외)
            const sortedEntries = categoryOrder
              .map(key => [key, TARGET_OPTIONS[key]])
              .filter(([key, cat]) => cat);
            
            return sortedEntries.map(([key, category]) => {
              const isActive = currentCell.targets[key] && Object.keys(currentCell.targets[key]).length > 0;
              
              return (
                <AccordionItem 
                  key={key} 
                  value={key}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden data-[state=open]:border-blue-200 transition-colors"
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                        {category.label}
                      </span>
                      {isActive && (
                        <Badge className="bg-blue-100 text-blue-700 border-0 w-5 h-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                          {Object.keys(currentCell.targets[key]).length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-1 bg-gray-50/50">
                  {/* Target Description Box */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                          <div className="mt-0.5 bg-blue-500 rounded-full p-0.5 flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <p className="text-sm text-blue-700 font-medium leading-snug">
                            {generateCategoryDescription(key)}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-6">
                    {category.fields
                      .filter(field => {
                        // DEMO 카테고리의 성별과 연령대 필드는 제외
                        if (key === 'DEMO' && (field.key === 'gender' || field.key === 'age_10s')) {
                          return false;
                        }
                        return true;
                      })
                      .map((field) => (
                      <div key={field.key} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-bold text-gray-700">
                            {field.label}
                          </label>
                          {field.type === 'checkbox' && (
                            <span className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                              중복선택
                            </span>
                          )}
                        </div>

                        {field.type === 'text' ? (
                          <Input
                            value={currentCell.targets[key]?.[field.key] || ''}
                            onChange={(e) => handleTextChange(key, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="bg-white border-gray-200 focus:border-blue-500 rounded-xl"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {field.options.map((option) => {
                              const isSelected = field.type === 'radio'
                                ? currentCell.targets[key]?.[field.key] === option.value
                                : currentCell.targets[key]?.[field.key]?.includes(option.value);
                              
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => handleOptionToggle(key, field.key, option.value, field.type)}
                                  className={`
                                    px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border
                                    ${isSelected 
                                      ? 'bg-blue-500 border-blue-500 text-white shadow-md transform scale-[1.02]' 
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'}
                                  `}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              );
            })
          })()}
        </Accordion>
      </main>

      {/* Footer - Sticky */}
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-50 flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3 max-w-md mx-auto w-full">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl h-12"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
          <Button
            onClick={handleApply}
            className="flex-[2] bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl h-12 shadow-lg font-bold text-base hover:opacity-90 transition-opacity"
          >
            <Check className="w-5 h-5 mr-2" />
            {summaryTags.length}개 조건 적용하기
          </Button>
        </div>
      </footer>
    </div>
  );
}