import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2, Save, GitBranch, ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BranchingModal({ 
  initialData,
  onSave,
  onClose 
}) {
  const [branchData, setBranchData] = useState(initialData || {
    id: Date.now(),
    question_text: '',
    question_type: 'branching_choice',
    options: ['', ''],
    children: {},
    branchEndTypes: {},
    cost: 15
  });

  const [expandedNodes, setExpandedNodes] = useState({});

  const getQuestionTypeCost = (type, depth = 0) => {
    const baseCosts = {
      multiple_choice: 10,
      multiple_select: 10,
      ranking: 10,
      branching_choice: 15,
      numeric_rating: 10,
      likert_scale: 10,
      image_choice: 37
    };
    const baseCost = baseCosts[type] || 10;
    return depth > 0 ? Math.round(baseCost * 0.7) : baseCost;
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      multiple_choice: '객관식',
      multiple_select: '다중선택',
      ranking: '순위형',
      branching_choice: '분기형',
      numeric_rating: '수치평정',
      likert_scale: '리커트척도',
      image_choice: '이미지선택'
    };
    return labels[type] || type;
  };

  const addOption = () => {
    if (branchData.options.length < 5) {
      setBranchData({
        ...branchData,
        options: [...branchData.options, '']
      });
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...branchData.options];
    const oldValue = newOptions[index];
    newOptions[index] = value;
    
    const children = { ...branchData.children };
    if (children[oldValue]) {
      children[value] = children[oldValue];
      delete children[oldValue];
    }
    
    const branchEndTypes = { ...branchData.branchEndTypes };
    if (branchEndTypes[oldValue]) {
      branchEndTypes[value] = branchEndTypes[oldValue];
      delete branchEndTypes[oldValue];
    }
    
    setBranchData({ ...branchData, options: newOptions, children, branchEndTypes });
  };

  const removeOption = (index) => {
    if (branchData.options.length > 2) {
      const option = branchData.options[index];
      const children = { ...branchData.children };
      delete children[option];
      const branchEndTypes = { ...branchData.branchEndTypes };
      delete branchEndTypes[option];
      
      setBranchData({
        ...branchData,
        options: branchData.options.filter((_, i) => i !== index),
        children,
        branchEndTypes
      });
    }
  };

  const addChildQuestion = (option) => {
    const children = { ...branchData.children };
    if (!children[option]) {
      children[option] = [];
    }
    
    children[option].push({
      id: `child_${Date.now()}_${Math.random()}`,
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', ''],
      children: undefined,
      branchEndTypes: undefined,
      image_urls: [],
      image_descriptions: [],
      order: children[option].length,
      cost: getQuestionTypeCost('multiple_choice', 1)
    });
    
    setBranchData({ ...branchData, children });
    
    const nodeKey = `${option}`;
    setExpandedNodes({ ...expandedNodes, [nodeKey]: true });
  };

  const updateChild = (option, childIndex, updatedChild) => {
    const children = { ...branchData.children };
    children[option][childIndex] = updatedChild;
    setBranchData({ ...branchData, children });
  };

  const removeChild = (option, childIndex) => {
    const children = { ...branchData.children };
    children[option] = children[option].filter((_, i) => i !== childIndex);
    setBranchData({ ...branchData, children });
  };

  const toggleNode = (nodeKey) => {
    setExpandedNodes({
      ...expandedNodes,
      [nodeKey]: !expandedNodes[nodeKey]
    });
  };

  const calculateTotalCost = (branch = branchData, depth = 0) => {
    let total = branch.cost || (branch.question_type === 'branching_choice' ? 15 : 10);
    if (branch.children) {
      Object.values(branch.children).forEach(childArray => {
        childArray.forEach(child => {
          total += calculateTotalCost(child, depth + 1);
        });
      });
    }
    return total;
  };

  const renderChild = (child, option, childIndex, depth = 1) => {
    const nodeKey = `${option}_${childIndex}`;
    const isExpanded = expandedNodes[nodeKey];
    const hasChildren = child.children && Object.keys(child.children).length > 0;

    return (
      <div key={child.id} className="ml-8 mt-2">
        <Card className="bg-white border border-gray-200 hover:border-blue-300 transition-colors">
          <CardContent className="p-3">
            <div className="space-y-2">
              {/* 헤더 */}
              <div className="flex items-center gap-2">
                {hasChildren && (
                  <button
                    onClick={() => toggleNode(nodeKey)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                )}
                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                  {depth}차
                </Badge>
                <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                  {getQuestionTypeLabel(child.question_type)}
                </Badge>
                <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                  {child.cost}원
                </Badge>
                {depth > 0 && (
                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                    70% 할인
                  </Badge>
                )}
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeChild(option, childIndex)}
                  className="h-6 w-6 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* 질문 입력 */}
              <Input
                value={child.question_text}
                onChange={(e) => updateChild(option, childIndex, { ...child, question_text: e.target.value })}
                placeholder="질문을 입력하세요"
                className="text-sm"
              />

              {/* 타입 선택 */}
              <Select
                value={child.question_type}
                onValueChange={(value) => {
                  const newCost = getQuestionTypeCost(value, depth);
                  const updated = { ...child, question_type: value, cost: newCost };
                  
                  if (value === 'multiple_choice' || value === 'multiple_select' || value === 'ranking') {
                    updated.options = ['', ''];
                  } else if (value === 'branching_choice') {
                    updated.options = ['', ''];
                    updated.children = {};
                    updated.branchEndTypes = {};
                  } else if (value === 'image_choice') {
                    updated.options = [];
                    updated.image_urls = [];
                    updated.image_descriptions = [];
                  } else {
                    updated.options = [];
                  }
                  
                  updateChild(option, childIndex, updated);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  <SelectItem value="multiple_choice">객관식</SelectItem>
                  <SelectItem value="multiple_select">다중선택</SelectItem>
                  <SelectItem value="ranking">순위형</SelectItem>
                  <SelectItem value="branching_choice">분기형</SelectItem>
                  <SelectItem value="numeric_rating">수치평정</SelectItem>
                  <SelectItem value="likert_scale">리커트척도</SelectItem>
                  <SelectItem value="image_choice">이미지선택 (분기 내 미지원)</SelectItem>
                </SelectContent>
              </Select>

              {/* 선택지 (객관식, 다중선택, 순위형) */}
              {(child.question_type === 'multiple_choice' || 
                child.question_type === 'multiple_select' || 
                child.question_type === 'ranking') && (
                <div className="space-y-1">
                  {child.options.map((opt, idx) => (
                    <div key={idx} className="flex gap-1">
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...child.options];
                          newOpts[idx] = e.target.value;
                          updateChild(option, childIndex, { ...child, options: newOpts });
                        }}
                        placeholder={`선택지 ${idx + 1}`}
                        className="text-xs h-7"
                      />
                      {child.options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newOpts = child.options.filter((_, i) => i !== idx);
                            updateChild(option, childIndex, { ...child, options: newOpts });
                          }}
                          className="h-7 w-7 text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {child.options.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateChild(option, childIndex, { 
                          ...child, 
                          options: [...child.options, ''] 
                        });
                      }}
                      className="w-full h-7 text-xs border-dashed"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      선택지 추가
                    </Button>
                  )}
                </div>
              )}

              {/* 이미지 선택 안내 */}
              {child.question_type === 'image_choice' && (
                <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                  <p className="text-xs text-purple-700">
                    ⚠️ 이미지 선택은 분기형 내부에서 지원되지 않습니다. 루트 레벨에서 사용해주세요.
                  </p>
                </div>
              )}

              {/* 분기형인 경우 재귀 렌더링 */}
              {child.question_type === 'branching_choice' && (
                <div className="mt-2 space-y-2 pl-4 border-l-2 border-blue-200">
                  {child.options.map((childOpt, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3 text-blue-500" />
                        <Input
                          value={childOpt}
                          onChange={(e) => {
                            const newOpts = [...child.options];
                            const oldOpt = newOpts[idx];
                            newOpts[idx] = e.target.value;
                            
                            const updated = { ...child, options: newOpts };
                            if (updated.children?.[oldOpt]) {
                              updated.children[e.target.value] = updated.children[oldOpt];
                              delete updated.children[oldOpt];
                            }
                            if (updated.branchEndTypes?.[oldOpt]) {
                              updated.branchEndTypes[e.target.value] = updated.branchEndTypes[oldOpt];
                              delete updated.branchEndTypes[oldOpt];
                            }
                            
                            updateChild(option, childIndex, updated);
                          }}
                          placeholder={`선택지 ${idx + 1}`}
                          className="text-xs h-7 flex-1"
                        />
                        {child.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const optToRemove = child.options[idx];
                              const newOpts = child.options.filter((_, i) => i !== idx);
                              const updated = { ...child, options: newOpts };
                              if (updated.children?.[optToRemove]) {
                                delete updated.children[optToRemove];
                              }
                              if (updated.branchEndTypes?.[optToRemove]) {
                                delete updated.branchEndTypes[optToRemove];
                              }
                              updateChild(option, childIndex, updated);
                            }}
                            className="h-7 w-7 text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      
                      {isExpanded && child.children?.[childOpt]?.map((grandchild, gIdx) => 
                        renderChild(grandchild, childOpt, gIdx, depth + 1)
                      )}
                      
                      {isExpanded && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updated = { ...child };
                              if (!updated.children) updated.children = {};
                              if (!updated.children[childOpt]) updated.children[childOpt] = [];
                              updated.children[childOpt].push({
                                id: `grandchild_${Date.now()}_${Math.random()}`,
                                question_text: '',
                                question_type: 'multiple_choice',
                                options: ['', ''],
                                image_urls: [],
                                image_descriptions: [],
                                cost: getQuestionTypeCost('multiple_choice', depth + 1)
                              });
                              updateChild(option, childIndex, updated);
                            }}
                            className="w-full h-7 text-xs border-dashed"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            후속 추가
                          </Button>

                          {/* 분기 종료 옵션 */}
                          <Card className="bg-gray-50">
                            <CardContent className="p-2">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-600 whitespace-nowrap">"{childOpt}" 종료 후:</span>
                                <Select
                                  value={child.branchEndTypes?.[childOpt] || 'end_survey'}
                                  onValueChange={(value) => {
                                    const updated = { ...child };
                                    if (!updated.branchEndTypes) updated.branchEndTypes = {};
                                    updated.branchEndTypes[childOpt] = value;
                                    updateChild(option, childIndex, updated);
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-[70]">
                                    <SelectItem value="end_survey">설문 종료</SelectItem>
                                    <SelectItem value="continue">다음 질문으로</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {isExpanded && child.options.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateChild(option, childIndex, { 
                          ...child, 
                          options: [...child.options, ''] 
                        });
                      }}
                      className="w-full h-7 text-xs border-dashed"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      선택지 추가
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const isValid = branchData.question_text && 
    branchData.options.every(o => o);

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <GitBranch className="w-6 h-6" />
              <h2 className="text-2xl font-bold">분기형 질문 설계</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-emerald-50 text-sm">
            트리 구조로 분기 흐름을 설계하세요
          </p>
        </div>

        {/* 내용 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 메인 질문 */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500 text-white border-0">
                  분기 시작
                </Badge>
                <Badge className="bg-orange-100 text-orange-700 border-0">
                  {branchData.cost}원
                </Badge>
              </div>
              
              <Input
                value={branchData.question_text}
                onChange={(e) => setBranchData({ ...branchData, question_text: e.target.value })}
                placeholder="분기형 질문을 입력하세요"
                className="border-emerald-300 bg-white text-base font-medium"
              />

              <div className="space-y-2">
                <div className="text-sm font-medium text-emerald-700">선택지</div>
                {branchData.options.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`선택지 ${idx + 1}`}
                      className="border-emerald-200 bg-white"
                    />
                    {branchData.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(idx)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {branchData.options.length < 5 && (
                  <Button
                    variant="outline"
                    onClick={addOption}
                    className="w-full border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    선택지 추가
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 분기 트리 */}
          <div className="space-y-4">
            {branchData.options.map((option, idx) => (
              option && (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-emerald-500" />
                    <Badge className="bg-emerald-500 text-white border-0">
                      "{option}" 선택 시
                    </Badge>
                  </div>

                  <div className="ml-6 space-y-2">
                    {branchData.children?.[option]?.map((child, childIdx) => 
                      renderChild(child, option, childIdx)
                    )}

                    <Button
                      variant="outline"
                      onClick={() => addChildQuestion(option)}
                      className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      후속 질문 추가
                    </Button>

                    <Card className="bg-gray-50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 whitespace-nowrap">"{option}" 종료 후:</span>
                          <Select
                            value={branchData.branchEndTypes?.[option] || 'end_survey'}
                            onValueChange={(value) => {
                              const branchEndTypes = { ...branchData.branchEndTypes };
                              branchEndTypes[option] = value;
                              setBranchData({ ...branchData, branchEndTypes });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[70]">
                              <SelectItem value="end_survey">설문 종료</SelectItem>
                              <SelectItem value="continue">다음 질문으로</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* 푸터 - Sticky at bottom */}
        <div className="border-t bg-white p-4 flex items-center justify-between shadow-lg flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">총 비용:</span>
            <Badge className="bg-emerald-500 text-white text-base px-3 py-1">
              {calculateTotalCost()}원
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={() => onSave(branchData)}
              disabled={!isValid}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
            >
              <Save className="w-4 h-4 mr-2" />
              완료
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}