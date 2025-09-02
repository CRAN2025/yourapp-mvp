import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClientMigration from '@/components/ClientMigration';

interface MigrationCandidate {
  collection: string;
  id: string;
  preview: {
    email?: string;
    name?: string;
    category?: string;
    hasProducts?: boolean;
  };
}

export default function DataMigration() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Migration Tool</h1>
        
        {/* Client-Side Migration Tool */}
        <div className="mb-8">
          <ClientMigration />
        </div>
      </div>
    </div>
  );
}

function LegacyDataMigration() {
  const [candidates, setCandidates] = useState<MigrationCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<MigrationCandidate | null>(null);
  const [newUserId, setNewUserId] = useState('');
  const [userData, setUserData] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/admin/list-migration-candidates');
      const data = await response.json();
      setCandidates(data.candidates || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load migration candidates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidate: MigrationCandidate) => {
    setSelectedCandidate(candidate);
    setUserData(JSON.stringify({
      email: candidate.preview.email,
      storeName: candidate.preview.name,
      category: candidate.preview.category,
      // Add default values that might be missing
      country: '',
      whatsappNumber: '',
      onboardingCompleted: false,
      status: 'draft'
    }, null, 2));
  };

  const handleMigration = async () => {
    if (!selectedCandidate || !newUserId || !userData) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      let parsedUserData;
      try {
        parsedUserData = JSON.parse(userData);
      } catch (parseError) {
        throw new Error('Invalid JSON in user data field');
      }

      const response = await fetch('/admin/migrate-user-to-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldUserId: selectedCandidate.id,
          newUserId: newUserId,
          userData: parsedUserData
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Migration Successful',
          description: `Migrated ${selectedCandidate.id} to seller ${newUserId}. Products migrated: ${result.productsCount || 0}`,
        });
        
        // Reset form
        setSelectedCandidate(null);
        setNewUserId('');
        setUserData('');
        
        // Reload candidates
        loadCandidates();
      } else {
        throw new Error(result.error || 'Migration failed');
      }
    } catch (error: any) {
      toast({
        title: 'Migration Failed',
        description: error?.message || 'An error occurred during migration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Data Migration Tool</h1>
        <p className="text-gray-600 mt-2">
          Migrate old user data to the current seller structure
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Migration Candidates */}
        <Card>
          <CardHeader>
            <CardTitle>Migration Candidates</CardTitle>
            <CardDescription>
              Select data to migrate from old collections
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !selectedCandidate ? (
              <div className="flex justify-center p-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {candidates.map((candidate, index) => (
                  <div
                    key={`${candidate.collection}-${candidate.id}`}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedCandidate?.id === candidate.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectCandidate(candidate)}
                  >
                    <div className="font-medium text-sm">
                      {candidate.collection}/{candidate.id}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {candidate.preview.email && (
                        <div>Email: {candidate.preview.email}</div>
                      )}
                      {candidate.preview.name && (
                        <div>Name: {candidate.preview.name}</div>
                      )}
                      {candidate.preview.category && (
                        <div>Category: {candidate.preview.category}</div>
                      )}
                    </div>
                  </div>
                ))}
                {candidates.length === 0 && !loading && (
                  <div className="text-center text-gray-500 py-4">
                    No migration candidates found
                  </div>
                )}
              </div>
            )}
            
            <Button 
              onClick={loadCandidates} 
              variant="outline" 
              className="w-full mt-4"
              disabled={loading}
            >
              Refresh Candidates
            </Button>
          </CardContent>
        </Card>

        {/* Migration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Migration Configuration</CardTitle>
            <CardDescription>
              Configure the migration parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCandidate ? (
              <>
                <div>
                  <Label>Selected Source</Label>
                  <div className="p-2 bg-gray-100 rounded text-sm">
                    {selectedCandidate.collection}/{selectedCandidate.id}
                  </div>
                </div>

                <div>
                  <Label htmlFor="newUserId">New User ID (Firebase Auth UID)</Label>
                  <Input
                    id="newUserId"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    placeholder="Enter the Firebase Auth UID for this seller"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    This should be the UID from Firebase Authentication
                  </div>
                </div>

                <div>
                  <Label htmlFor="userData">User Data (JSON)</Label>
                  <Textarea
                    id="userData"
                    value={userData}
                    onChange={(e) => setUserData(e.target.value)}
                    rows={12}
                    className="font-mono text-xs"
                    placeholder="Enter user data as JSON"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Modify the JSON data as needed before migration
                  </div>
                </div>

                <Button 
                  onClick={handleMigration}
                  disabled={loading || !newUserId || !userData}
                  className="w-full"
                >
                  {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                  Migrate Data
                </Button>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a migration candidate to configure the migration
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}