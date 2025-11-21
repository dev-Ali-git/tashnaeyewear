import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  updated_at: string;
}

const Pages = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title');

      if (error) throw error;
      setPages(data || []);
      if (data && data.length > 0) {
        setSelectedPage(data[0]);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: "Error",
        description: "Failed to load pages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPage) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pages')
        .update({
          content: selectedPage.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPage.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Page content updated successfully"
      });

      fetchPages();
    } catch (error) {
      console.error('Error updating page:', error);
      toast({
        title: "Error",
        description: "Failed to update page content",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Page Management</h1>
        <p className="text-muted-foreground">
          Manage content for website pages
        </p>
      </div>

      <Tabs value={selectedPage?.id} onValueChange={(id) => {
        const page = pages.find(p => p.id === id);
        if (page) setSelectedPage(page);
      }}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          {pages.map((page) => (
            <TabsTrigger key={page.id} value={page.id}>
              {page.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {pages.map((page) => (
          <TabsContent key={page.id} value={page.id}>
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label>Page Title</Label>
                  <Input value={page.title} disabled className="mt-2" />
                </div>

                <div>
                  <Label>Page Slug</Label>
                  <Input value={page.slug} disabled className="mt-2" />
                </div>

                <div>
                  <Label>Content (HTML supported)</Label>
                  <Textarea
                    value={selectedPage?.id === page.id ? selectedPage.content : page.content}
                    onChange={(e) => {
                      if (selectedPage?.id === page.id) {
                        setSelectedPage({ ...selectedPage, content: e.target.value });
                      }
                    }}
                    rows={15}
                    className="mt-2 font-mono text-sm"
                    placeholder="Enter page content here. HTML tags are supported."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(page.updated_at).toLocaleString()}
                  </p>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Pages;
