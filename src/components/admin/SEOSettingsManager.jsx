import React, { useState } from "react";
import { SEOSetting } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Save, Trash2, Globe } from "lucide-react";

export default function SEOSettingsManager() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    page_path: "",
    title: "",
    meta_description: "",
    meta_keywords: "",
    og_image: ""
  });

  const { data: seoSettings = [] } = useQuery({
    queryKey: ['seoSettings'],
    queryFn: () => SEOSetting.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        await SEOSetting.update(editingId, data);
      } else {
        await SEOSetting.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['seoSettings']);
      setIsEditing(false);
      setEditingId(null);
      setFormData({ page_path: "", title: "", meta_description: "", meta_keywords: "", og_image: "" });
      alert("저장되었습니다.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await SEOSetting.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['seoSettings']);
      alert("삭제되었습니다.");
    }
  });

  const handleEdit = (setting) => {
    setEditingId(setting.id);
    setFormData({
      page_path: setting.page_path,
      title: setting.title,
      meta_description: setting.meta_description,
      meta_keywords: setting.meta_keywords,
      og_image: setting.og_image
    });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ page_path: "", title: "", meta_description: "", meta_keywords: "", og_image: "" });
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-500" />
          SEO 설정 관리
        </h2>
        <Button onClick={handleAddNew} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> 새 페이지 추가
        </Button>
      </div>

      {isEditing && (
        <Card className="mb-6 border-blue-200 shadow-md">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100">
            <CardTitle className="text-lg text-blue-900">{editingId ? "SEO 설정 수정" : "새 SEO 설정 추가"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">페이지 경로</label>
                <Input 
                  value={formData.page_path} 
                  onChange={(e) => setFormData({...formData, page_path: e.target.value})}
                  placeholder="예: /about (메인은 /)"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">페이지 타이틀 (Browser Tab)</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="예: 회사소개 - 픽켓팅"
                  className="bg-white"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">메타 설명 (Description)</label>
              <Textarea 
                value={formData.meta_description} 
                onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                placeholder="검색 결과에 표시될 설명을 입력하세요..."
                className="bg-white min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">메타 키워드</label>
                <Input 
                  value={formData.meta_keywords} 
                  onChange={(e) => setFormData({...formData, meta_keywords: e.target.value})}
                  placeholder="예: 설문조사, 마케팅, 데이터"
                  className="bg-white"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">OG 이미지 URL</label>
                <Input 
                  value={formData.og_image} 
                  onChange={(e) => setFormData({...formData, og_image: e.target.value})}
                  placeholder="https://..."
                  className="bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>취소</Button>
              <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> 저장
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {seoSettings.map(setting => (
          <Card key={setting.id} className="hover:shadow-md transition-all group border-gray-200">
            <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-xs font-bold font-mono">{setting.page_path}</span>
                  <h3 className="font-bold text-lg text-gray-900">{setting.title}</h3>
                </div>
                <p className="text-gray-500 text-sm line-clamp-2 mb-2">{setting.meta_description || "설명 없음"}</p>
                <div className="flex flex-wrap gap-2">
                   {setting.meta_keywords && (
                     <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Tags: {setting.meta_keywords}</span>
                   )}
                </div>
              </div>
              <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" onClick={() => handleEdit(setting)}>수정</Button>
                <Button size="sm" variant="destructive" onClick={() => {
                  if(confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate(setting.id);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {seoSettings.length === 0 && !isEditing && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500">
            <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 SEO 설정이 없습니다.</p>
            <Button onClick={handleAddNew} variant="link" className="text-blue-600">첫 페이지 추가하기</Button>
          </div>
        )}
      </div>
    </div>
  );
}