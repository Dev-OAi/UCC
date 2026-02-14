import React, { useState } from 'react';
import { ProductGuide, ProductCategory, Product } from '../types';
import { Card, Button, Modal, Input, Textarea, PencilIcon, TrashIcon, CloseIcon } from './ui';

const EMPTY_PRODUCT: Omit<Product, 'id'> = { name: '', summary: '', details: '' };

const ProductRenderer: React.FC<{
    product: Product;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ product, onEdit, onDelete }) => (
    <Card className="mb-6 product-card">
        <div className="flex justify-between items-start">
            <div>
                <h3 id={product.id} className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{product.name}</h3>
                <p className="text-[var(--color-text-secondary)] italic mb-4">{product.summary}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-4">
                <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${product.name}`}><PencilIcon className="w-4 h-4"/></Button>
                <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Delete ${product.name}`} className="text-red-500 hover:bg-red-500/10 hover:text-red-500"><TrashIcon className="w-4 h-4"/></Button>
            </div>
        </div>
        <div
            className="prose prose-sm max-w-none text-[var(--color-text-secondary)]"
            dangerouslySetInnerHTML={{ __html: product.details }}
        />
    </Card>
);

const ProductCategoryRenderer: React.FC<{
    category: ProductCategory;
    onEditProduct: (product: Product, categoryId: string) => void;
    onDeleteProduct: (productId: string) => void;
    onAddProduct: (categoryId: string) => void;
}> = ({ category, onEditProduct, onDeleteProduct, onAddProduct }) => (
    <div className="mb-10">
        <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{borderColor: 'var(--color-border-light)'}}>
            <h2 id={category.id} className="text-2xl font-bold text-[var(--color-text-primary)]">{category.name}</h2>
            <Button size="sm" onClick={() => onAddProduct(category.id)}>Add Product</Button>
        </div>
        {category.products.map(product =>
            <ProductRenderer
                key={product.id}
                product={product}
                onEdit={() => onEditProduct(product, category.id)}
                onDelete={() => onDeleteProduct(product.id)}
            />
        )}
    </div>
);

interface ProductGuideRendererProps {
    guide: ProductGuide;
    setProductGuides: React.Dispatch<React.SetStateAction<ProductGuide[]>>;
}

const ProductGuideRenderer: React.FC<ProductGuideRendererProps> = ({ guide, setProductGuides }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<Product, 'id'>>(EMPTY_PRODUCT);

    const handleOpenAddModal = (categoryId: string) => {
        setEditingProduct(null);
        setFormData(EMPTY_PRODUCT);
        setTargetCategoryId(categoryId);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product: Product, categoryId: string) => {
        setEditingProduct(product);
        setFormData({ name: product.name, summary: product.summary, details: product.details });
        setTargetCategoryId(categoryId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setTargetCategoryId(null);
        setFormData(EMPTY_PRODUCT);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProduct = () => {
        if (!targetCategoryId || !formData.name) return;

        setProductGuides(prevGuides => {
            return prevGuides.map(g => {
                if (g.id !== guide.id) return g;

                const newCategories = g.categories.map(cat => {
                    if (cat.id !== targetCategoryId) return cat;

                    let newProducts;
                    if (editingProduct) { // Editing existing product
                        newProducts = cat.products.map(p =>
                            p.id === editingProduct.id ? { ...p, ...formData } : p
                        );
                    } else { // Adding new product
                        const newProduct: Product = {
                            id: `prod-${Date.now()}`,
                            ...formData
                        };
                        newProducts = [...cat.products, newProduct];
                    }
                    return { ...cat, products: newProducts };
                });
                return { ...g, categories: newCategories };
            });
        });

        handleCloseModal();
    };

    const handleDeleteProduct = (productId: string) => {
        if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
            setProductGuides(prevGuides => prevGuides.map(g => {
                if (g.id !== guide.id) return g;

                const newCategories = g.categories.map(cat => ({
                    ...cat,
                    products: cat.products.filter(p => p.id !== productId)
                }));

                return { ...g, categories: newCategories };
            }));
        }
    };

    return (
    <>
        <div className="flex-1 overflow-auto p-6 md:p-10 scroll-smooth">
            <div className="max-w-4xl mx-auto">
                <h1 id={guide.id} className="text-4xl font-bold text-[var(--color-text-primary)] leading-tight">{guide.longTitle}</h1>
                <hr className="my-8" style={{borderColor: 'var(--color-border-light)'}} />
                {guide.categories.map((category) => (
                    <ProductCategoryRenderer
                        key={category.id}
                        category={category}
                        onAddProduct={handleOpenAddModal}
                        onEditProduct={handleOpenEditModal}
                        onDeleteProduct={handleDeleteProduct}
                    />
                ))}
            </div>
        </div>

        <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={editingProduct ? 'Edit Product' : 'Add New Product'}
            footer={
                <>
                    <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                    <Button onClick={handleSaveProduct} disabled={!formData.name}>Save Product</Button>
                </>
            }
        >
            <div className="space-y-4">
                <Input
                    label="Product Name"
                    id="prod-name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., Online Platform"
                    required
                />
                <Textarea
                    label="Summary"
                    id="prod-summary"
                    name="summary"
                    value={formData.summary}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="A brief, one-sentence summary of the product."
                />
                <Textarea
                    label="Details (HTML supported)"
                    id="prod-details"
                    name="details"
                    value={formData.details}
                    onChange={handleFormChange}
                    rows={10}
                    placeholder="Use HTML for formatting, e.g., <p>, <ul>, <li>, <b>"
                />
            </div>
        </Modal>

        <style>{`
            .prose p { margin-bottom: 0.5rem; }
            .prose ul { list-style: disc; padding-left: 20px; }
            .prose b { color: var(--color-text-primary); }
        `}</style>
    </>
    );
};

export default ProductGuideRenderer;
