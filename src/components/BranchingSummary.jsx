import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Edit, ChevronRight, ArrowRight } from "lucide-react";

export default function BranchingSummary({ branchQuestion, onEdit }) {
  const calculateStats = (branch, depth = 0) => {
    let totalQuestions = 1;
    let totalCost = branch.cost || 15;
    let maxDepth = depth;

    if (branch.children) {
      Object.values(branch.children).forEach(childArray => {
        childArray.forEach(child => {
          totalCost += child.cost || 10;
          totalQuestions += 1;
          
          if (child.question_type === 'branching_choice' && child.children) {
            const childStats = calculateStats(child, depth + 1);
            totalQuestions += childStats.totalQuestions - 1;
            totalCost += childStats.totalCost - (child.cost || 15);
            maxDepth = Math.max(maxDepth, childStats.maxDepth);
          }
        });
      });
    }

    return { totalQuestions, totalCost, maxDepth };
  };

  const stats = calculateStats(branchQuestion);

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

  const renderBranchPreview = (branch, option = null, depth = 0) => {
    if (depth > 2) return null; // 미리보기는 3단계까지만

    return (
      <div className={`${depth > 0 ? 'ml-4' : ''} space-y-1`}>
        {option && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ArrowRight className="w-3 h-3" />
            <span>"{option}" 선택 시</span>
          </div>
        )}
        
        {branch.children && Object.entries(branch.children).slice(0, 2).map(([opt, children]) => (
          <div key={opt}>
            {children.slice(0, 2).map((child, idx) => (
              <div key={child.id} className="text-xs text-gray-600 ml-2">
                • {child.question_text || '(질문)'}
                {child.question_type === 'branching_choice' && child.children && (
                  <span className="text-emerald-600 ml-1">[+{Object.keys(child.children).length}개 분기]</span>
                )}
              </div>
            ))}
          </div>
        ))}
        
        {branch.children && Object.keys(branch.children).length > 2 && (
          <div className="text-xs text-gray-400 ml-2">
            ... 외 {Object.keys(branch.children).length - 2}개 분기
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-300 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-emerald-500 text-white border-0">
                  <GitBranch className="w-3 h-3 mr-1" />
                  분기형
                </Badge>
                <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                  {stats.totalCost}원
                </Badge>
              </div>
              
              <h3 className="font-bold text-gray-800 mb-1">
                {branchQuestion.question_text}
              </h3>
              
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                  {branchQuestion.options.length}개 선택지
                </Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  총 {stats.totalQuestions}개 질문
                </Badge>
                {stats.maxDepth > 0 && (
                  <Badge variant="outline" className="border-purple-300 text-purple-700">
                    {stats.maxDepth + 1}단계 분기
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="border-emerald-300 text-emerald-600 hover:bg-emerald-100"
            >
              <Edit className="w-3 h-3 mr-1" />
              편집
            </Button>
          </div>

          {/* 선택지 미리보기 */}
          <div className="bg-white/70 rounded-lg p-3 space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">분기 구조:</div>
            {branchQuestion.options.slice(0, 3).map((option, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {option}
                  </span>
                  <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                    {branchQuestion.children?.[option]?.length || 0}개 후속
                  </Badge>
                </div>
                {renderBranchPreview(branchQuestion, option, 1)}
              </div>
            ))}
            
            {branchQuestion.options.length > 3 && (
              <div className="text-xs text-gray-400 ml-5">
                ... 외 {branchQuestion.options.length - 3}개 선택지
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}