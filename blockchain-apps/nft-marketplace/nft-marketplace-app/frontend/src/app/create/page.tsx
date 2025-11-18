'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { useDropzone } from 'react-dropzone';
import { Upload, Sparkles, Loader2 } from 'lucide-react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { NFT_CONTRACT_ADDRESS, NFT_ABI } from '@/lib/contracts';
import { uploadFileToIPFS, uploadMetadataToIPFS, generateNFTDescription } from '@/utils/ipfs';
import toast from 'react-hot-toast';
import { parseETH } from '@/utils/format';

export default function CreatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState<Array<{ trait_type: string; value: string }>>([]);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setFile(file);
      setPreview(URL.createObjectURL(file));
    },
  });

  const { data: mintData, write: mint } = useContractWrite({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'mint',
  });

  const { isLoading: isMinting, isSuccess } = useWaitForTransaction({
    hash: mintData?.hash,
  });

  const handleGenerateDescription = async () => {
    if (!name) {
      toast.error('Please enter a name first');
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const generatedDescription = await generateNFTDescription(name, attributes);
      if (generatedDescription) {
        setDescription(generatedDescription);
        toast.success('Description generated!');
      }
    } catch (error) {
      toast.error('Failed to generate description');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleMint = async () => {
    if (!file || !name || !description) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsUploadingToIPFS(true);
    try {
      // Upload image to IPFS
      toast.loading('Uploading image to IPFS...');
      const imageUri = await uploadFileToIPFS(file);

      // Create metadata
      const metadata = {
        name,
        description,
        image: imageUri,
        attributes,
      };

      // Upload metadata to IPFS
      toast.loading('Uploading metadata to IPFS...');
      const metadataUri = await uploadMetadataToIPFS(metadata);

      setIsUploadingToIPFS(false);
      toast.dismiss();

      // Mint NFT
      const mintPrice = parseETH('0.01'); // Get from contract
      mint?.({
        args: [mintData?.from, metadataUri],
        value: mintPrice,
      });

      toast.success('Minting NFT...');
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error('Failed to mint NFT');
      setIsUploadingToIPFS(false);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Create NFT</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column - Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload File</label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="relative aspect-square max-w-sm mx-auto">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="py-12">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop an image, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, GIF, WEBP (max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background"
                placeholder="My Awesome NFT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border bg-background min-h-[120px]"
                  placeholder="A detailed description of your NFT..."
                />
                <button
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDescription || !name}
                  className="absolute bottom-2 right-2 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                  title="Generate with AI"
                >
                  {isGeneratingDescription ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Click the AI button to generate a description
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Attributes</label>
                <button
                  onClick={addAttribute}
                  className="text-sm text-primary hover:underline"
                >
                  + Add Attribute
                </button>
              </div>

              <div className="space-y-2">
                {attributes.map((attr, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Type (e.g., Color)"
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Value (e.g., Blue)"
                    />
                    <button
                      onClick={() => removeAttribute(index)}
                      className="px-3 py-2 rounded-lg border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleMint}
              disabled={!file || !name || !description || isUploadingToIPFS || isMinting}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {isUploadingToIPFS || isMinting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isUploadingToIPFS ? 'Uploading...' : 'Minting...'}
                </>
              ) : (
                'Mint NFT (0.01 ETH)'
              )}
            </button>

            {isSuccess && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ NFT minted successfully!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
