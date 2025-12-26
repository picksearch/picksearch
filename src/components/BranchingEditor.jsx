import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, ArrowRight, GitBranch, Upload, Loader2, Image as ImageIcon, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadFile } from "@/api/integrations";

export default function BranchingEditor({ 
  branchQuestion, 
  onUpdate,
  onRemove,
  depth = 0,
  parentLabel = "Q"
}) {
  const [uploadingImages, setUploadingImages] = useState({});

  const getQuestionTypeCost = (type) => {
    const baseCosts = {
      multiple_choice: 10,
      multiple_select: 10,
      ranking: 10,
      branching_choice: 15,
      short_answer: 30,
      numeric_rating: 10,
      likert_scale: 10,
      image_choice: 37
    };
    const baseCost = baseCosts[type] || 10;
    return depth > 0 ? Math.round(baseCost * 0.7) : baseCost;
  };

  const addChildQuestion = (optionIndex, option) => {
    const children = branchQuestion.children || {};
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
      order: children[option].length,
      cost: getQuestionTypeCost('multiple_choice')
    });
    
    onUpdate({
      ...branchQuestion,
      children
    });
  };

  const updateChildQuestion = (option, childIndex, updatedChild) => {
    const children = { ...branchQuestion.children };
    children[option][childIndex] = updatedChild;
    
    onUpdate({
      ...branchQuestion,
      children
    });
  };

  const updateChildOption = (option, childIndex, optIndex, value) => {
    const children = { ...branchQuestion.children };
    const newOptions = [...children[option][childIndex].options];
    newOptions[optIndex] = value;
    children[option][childIndex].options = newOptions;
    
    onUpdate({
      ...branchQuestion,
      children
    });
  };

  const addChildOption = (option, childIndex) => {
    const children = { ...branchQuestion.children };
    if (children[option][childIndex].options.length < 5) {
      children[option][childIndex].options = [
        ...children[option][childIndex].options,
        ''
      ];
      onUpdate({
        ...branchQuestion,
        children
      });
    }
  };

  const removeChildOption = (option, childIndex, optIndex) => {
    const children = { ...branchQuestion.children };
    if (children[option][childIndex].options.length > 2) {
      children[option][childIndex].options = children[option][childIndex].options.filter((_, i) => i !== optIndex);
      onUpdate({
        ...branchQuestion,
        children
      });
    }
  };

  const removeChildQuestion = (option, childIndex) => {
    const children = { ...branchQuestion.children };
    children[option] = children[option].filter((_, i) => i !== childIndex);
    
    onUpdate({
      ...branchQuestion,
      children
    });
  };

  const setBranchEndType = (option, endType) => {
    const branchEndTypes = { ...(branchQuestion.branchEndTypes || {}) };
    branchEndTypes[option] = endType;
    
    onUpdate({
      ...branchQuestion,
      branchEndTypes
    });
  };

  const handleImageUpload = async (option, childIndex, file) => {
    if (!file) return;
    
    const key = `${option}_${childIndex}`;
    setUploadingImages(prev => ({ ...prev, [key]: true }));
    
    try {
      const { file_url } = await UploadFile({ file });
      
      const children = { ...branchQuestion.children };
      if (children[option][childIndex].image_urls.length < 2) {
        children[option][childIndex].image_urls = [...children[option][childIndex].image_urls, file_url];
        onUpdate({
          ...branchQuestion,
          children
        });
      }
    } catch (error) {
      alert('이미지 업로드에 실패했습니다');
    } finally {
      setUploadingImages(prev => ({ ...prev, [key]: false }));
    }
  };

  const removeImage = (option, childIndex, imageIndex) => {
    const children = { ...branchQuestion.children };
    children[option][childIndex].image_urls = children[option][childIndex].image_urls.filter((_, i) => i !== imageIndex);
    onUpdate({
      ...branchQuestion,
      children
    });
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      multiple_choice: '객관식',
      multiple_select: '다중선택',
      ranking: '순위형',
      branching_choice: '분기형',
      short_answer: '주관식',
      numeric_rating: '수치평정',
      likert_scale: '리커트척도',
      image_choice: '이미지선택'
    };
    return labels[type] || type;
  };

  const calculateTotalCost = () => {
    let total = branchQuestion.cost || 15;
    if (branchQuestion.children) {
      Object.values(branchQuestion.children).forEach(childArray => {
        childArray.forEach(child => {
          total += child.cost || 10;
          if (child.question_type === 'branching_choice' && child.children) {
            const calculateBranchCost = (branch) => {
              let cost = 0;
              Object.values(branch.children || {}).forEach(arr => {
                arr.forEach(c => {
                  cost += c.cost || 10;
                  if (c.question_type === 'branching_choice' && c.children) {
                    cost += calculateBranchCost(c);
                  }
                });
              });
              return cost;
            };
            total += calculateBranchCost(child);
          }
        });
      });
    }
    return total;
  };

  const borderColor = depth === 0 ? 'border-emerald-300' : depth === 1 ? 'border-blue-300' : 'border-purple-300';
  const badgeColor = depth === 0 ? 'bg-emerald-500' : depth === 1 ? 'bg-blue-500' : 'bg-purple-500';
  const bgColor = depth === 0 ? 'bg-emerald-50' : depth === 1 ? 'bg-blue-50' : 'bg-purple-50';

  return (
    <div className="space-y-3">
      {/* 메인 분기형 질문 */}
      <Card className={`bg-white rounded-2xl shadow-sm border-2 ${borderColor}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <Badge className={`${badgeColor} text-white border-0`}>
              <GitBranch className="w-3 h-3 mr-1" />
              {depth === 0 ? parentLabel : `${parentLabel}-${depth}차 분기`}
            </Badge>
            <div className="flex-1">
              <Input
                value={branchQuestion.question_text}
                onChange={(e) => onUpdate({ ...branchQuestion, question_text: e.target.value })}
                placeholder="분기형 질문을 입력하세요"
                className="border-gray-200 rounded-xl mb-2 font-medium"
              />
              <span className="text-xs text-emerald-600 font-bold">{branchQuestion.cost || 15}원</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* 선택지 */}
          <div className="space-y-2">
            {branchQuestion.options.map((option, optIndex) => (
              <div key={optIndex} className="flex gap-2 items-center">
                <ArrowRight className={`w-4 h-4 flex-shrink-0 ${depth === 0 ? 'text-emerald-500' : depth === 1 ? 'text-blue-500' : 'text-purple-500'}`} />
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...branchQuestion.options];
                    const oldOption = newOptions[optIndex];
                    newOptions[optIndex] = e.target.value;
                    
                    const children = { ...branchQuestion.children };
                    if (children[oldOption]) {
                      children[e.target.value] = children[oldOption];
                      delete children[oldOption];
                    }
                    
                    const branchEndTypes = { ...(branchQuestion.branchEndTypes || {}) };
                    if (branchEndTypes[oldOption]) {
                      branchEndTypes[e.target.value] = branchEndTypes[oldOption];
                      delete branchEndTypes[oldOption];
                    }
                    
                    onUpdate({
                      ...branchQuestion,
                      options: newOptions,
                      children,
                      branchEndTypes
                    });
                  }}
                  placeholder={`선택지 ${optIndex + 1}`}
                  className="border-gray-200 rounded-xl flex-1"
                />
                {branchQuestion.options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newOptions = branchQuestion.options.filter((_, i) => i !== optIndex);
                      const children = { ...branchQuestion.children };
                      delete children[option];
                      const branchEndTypes = { ...(branchQuestion.branchEndTypes || {}) };
                      delete branchEndTypes[option];
                      onUpdate({
                        ...branchQuestion,
                        options: newOptions,
                        children,
                        branchEndTypes
                      });
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {branchQuestion.options.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdate({
                    ...branchQuestion,
                    options: [...branchQuestion.options, '']
                  });
                }}
                className={`w-full border-dashed border-gray-300 text-gray-600 hover:border-${depth === 0 ? 'emerald' : depth === 1 ? 'blue' : 'purple'}-500 hover:text-${depth === 0 ? 'emerald' : depth === 1 ? 'blue' : 'purple'}-600 rounded-xl`}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                선택지 추가 ({branchQuestion.options.length}/5)
              </Button>
            )}
          </div>

          {/* 총 비용 */}
          <div className={`${bgColor} ${borderColor} rounded-xl p-3 border mt-4`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${depth === 0 ? 'text-emerald-700' : depth === 1 ? 'text-blue-700' : 'text-purple-700'} font-medium`}>
                이 분기의 총 비용
              </span>
              <span className={`text-lg font-bold ${depth === 0 ? 'text-emerald-600' : depth === 1 ? 'text-blue-600' : 'text-purple-600'}`}>
                {calculateTotalCost()}원
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 각 선택지별 후속 질문들 - 수직으로 나열 */}
      {branchQuestion.options.map((option, optIdx) => (
        option && (branchQuestion.children?.[option] || []).length > 0 && (
          <div key={`option-${optIdx}`} className="space-y-3">
            {/* 선택지 헤더 */}
            <div className="flex items-center gap-2">
              <ArrowDown className={`w-4 h-4 ${depth === 0 ? 'text-emerald-500' : depth === 1 ? 'text-blue-500' : 'text-purple-500'}`} />
              <Badge className={`${badgeColor} text-white border-0`}>
                "{option}" 선택 시
              </Badge>
            </div>

            {/* 후속 질문들 */}
            {(branchQuestion.children?.[option] || []).map((child, childIdx) => (
              <div key={child.id}>
                {child.question_type === 'branching_choice' ? (
                  <BranchingEditor
                    branchQuestion={child}
                    onUpdate={(updated) => updateChildQuestion(option, childIdx, updated)}
                    onRemove={() => removeChildQuestion(option, childIdx)}
                    depth={depth + 1}
                    parentLabel={depth === 0 ? `${parentLabel}.${optIdx + 1}` : `${parentLabel}.${optIdx + 1}`}
                  />
                ) : (
                  <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-gray-100 text-gray-700 border-0">
                          {depth === 0 ? `${parentLabel}.${optIdx + 1}.${childIdx + 1}` : `${parentLabel}.${optIdx + 1}.${childIdx + 1}`}
                        </Badge>
                        <div className="flex-1 space-y-3">
                          <Input
                            value={child.question_text}
                            onChange={(e) => updateChildQuestion(option, childIdx, { ...child, question_text: e.target.value })}
                            placeholder="후속 질문"
                            className="border-gray-200 rounded-xl text-sm"
                          />
                          
                          <div className="flex gap-2 items-center flex-wrap">
                            <Select
                              value={child.question_type}
                              onValueChange={(value) => {
                                const newCost = getQuestionTypeCost(value);
                                const updated = {
                                  ...child,
                                  question_type: value,
                                  cost: newCost
                                };
                                
                                if (value === 'multiple_choice' || value === 'multiple_select' || value === 'ranking') {
                                  updated.options = ['', ''];
                                } else if (value === 'branching_choice') {
                                  updated.options = ['', ''];
                                  updated.children = {};
                                  updated.branchEndTypes = {};
                                } else if (value === 'image_choice') {
                                  updated.options = [];
                                  updated.image_urls = [];
                                } else {
                                  updated.options = [];
                                }
                                
                                updateChildQuestion(option, childIdx, updated);
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs rounded-lg w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">객관식</SelectItem>
                                <SelectItem value="multiple_select">다중선택</SelectItem>
                                <SelectItem value="ranking">순위형</SelectItem>
                                <SelectItem value="branching_choice">분기형</SelectItem>
                                <SelectItem value="short_answer">주관식</SelectItem>
                                <SelectItem value="numeric_rating">수치평정</SelectItem>
                                <SelectItem value="likert_scale">리커트척도</SelectItem>
                                <SelectItem value="image_choice">이미지선택</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                              {child.cost}원
                            </Badge>
                            {depth > 0 && (
                              <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                                70% 할인
                              </Badge>
                            )}
                          </div>

                          {/* 객관식/다중선택/순위형 선택지 */}
                          {(child.question_type === 'multiple_choice' || 
                            child.question_type === 'multiple_select' || 
                            child.question_type === 'ranking') && (
                            <div className="space-y-1">
                              {child.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex gap-1">
                                  <Input
                                    value={opt}
                                    onChange={(e) => updateChildOption(option, childIdx, optIdx, e.target.value)}
                                    placeholder={`선택지 ${optIdx + 1}`}
                                    className="border-gray-200 rounded-lg text-xs h-8"
                                  />
                                  {child.options.length > 2 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeChildOption(option, childIdx, optIdx)}
                                      className="h-8 w-8 text-red-500"
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
                                  onClick={() => addChildOption(option, childIdx)}
                                  className="w-full h-7 border-dashed text-xs"
                                >
                                  <PlusCircle className="w-3 h-3 mr-1" />
                                  선택지 추가
                                </Button>
                              )}
                            </div>
                          )}

                          {/* 이미지 선택형 */}
                          {child.question_type === 'image_choice' && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                {child.image_urls.map((url, imgIdx) => (
                                  <div key={imgIdx} className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                    <img src={url} alt={`이미지 ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => removeImage(option, childIdx, imgIdx)}
                                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                
                                {child.image_urls.length < 2 && (
                                  <label className="w-full aspect-square rounded-lg border border-dashed border-purple-300 hover:border-purple-500 cursor-pointer flex flex-col items-center justify-center gap-1 bg-purple-50 hover:bg-purple-100 transition-all">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(option, childIdx, e.target.files[0])}
                                      className="hidden"
                                      disabled={uploadingImages[`${option}_${childIdx}`]}
                                    />
                                    {uploadingImages[`${option}_${childIdx}`] ? (
                                      <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                                    ) : (
                                      <>
                                        <Upload className="w-6 h-6 text-purple-500" />
                                        <span className="text-xs text-purple-600">업로드</span>
                                      </>
                                    )}
                                  </label>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 리커트/수치평정 안내 */}
                          {child.question_type === 'numeric_rating' && (
                            <div className="bg-teal-50 rounded-lg p-2 border border-teal-200">
                              <p className="text-xs text-teal-700">0~10점 중 선택</p>
                            </div>
                          )}
                          {child.question_type === 'likert_scale' && (
                            <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-200">
                              <p className="text-xs text-indigo-700">5점 척도 (1~5)</p>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChildQuestion(option, childIdx)}
                          className="text-red-500 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}

            {/* 후속 질문 추가 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addChildQuestion(optIdx, option)}
              className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl h-10"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              "{option}" 선택 시 후속 질문 추가
            </Button>

            {/* 분기 종료 방식 */}
            {(branchQuestion.children?.[option] || []).length > 0 && (
              <Card className="bg-gray-50 border-gray-200 rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">"{option}" 분기 종료 후:</span>
                    <Select
                      value={branchQuestion.branchEndTypes?.[option] || 'end_survey'}
                      onValueChange={(value) => setBranchEndType(option, value)}
                    >
                      <SelectTrigger className="h-8 text-xs rounded-lg flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="end_survey">설문 종료</SelectItem>
                        <SelectItem value="continue">다음 질문으로</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      ))}
    </div>
  );
}