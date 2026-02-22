import React, { useState } from 'react';
import { ProductGuide, ProductCategory, Product } from '../types';
import { Card, Button, Modal, Input, Textarea, PencilIcon, TrashIcon, CloseIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon } from './ui';

const EMPTY_PRODUCT: Omit<Product, 'id'> = { name: '', summary: '', details: '' };

const ProductRenderer: React.FC<{
    product: Product;
    onEdit: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
}> = ({ product, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => (
    <Card className="mb-6 product-card group">
        <div className="flex justify-between items-start">
            <div>
                <h3 id={product.id} className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{product.name}</h3>
                <p className="text-[var(--color-text-secondary)] italic mb-4">{product.summary}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-4">
                <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={isFirst} className="management-button" aria-label={`Move ${product.name} up`}><ChevronUpIcon className="w-4 h-4"/></Button>
                <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={isLast} className="management-button" aria-label={`Move ${product.name} down`}><ChevronDownIcon className="w-4 h-4"/></Button>
                <Button variant="ghost" size="sm" onClick={onEdit} className="management-button" aria-label={`Edit ${product.name}`}><PencilIcon className="w-4 h-4"/></Button>
                <Button variant="ghost" size="sm" onClick={onDelete} className="management-button text-red-500 hover:bg-red-500/10 hover:text-red-500" aria-label={`Delete ${product.name}`}><TrashIcon className="w-4 h-4"/></Button>
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
    onEditCategory: (category: ProductCategory) => void;
    onDeleteCategory: (categoryId: string) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveProduct: (productId: string, direction: 'up' | 'down') => void;
    isFirst: boolean;
    isLast: boolean;
}> = ({ category, onEditProduct, onDeleteProduct, onAddProduct, onEditCategory, onDeleteCategory, onMoveUp, onMoveDown, onMoveProduct, isFirst, isLast }) => (
    <div className="mb-10">
        <div className="flex justify-between items-center mb-4 pb-2 border-b category-header group" style={{borderColor: 'var(--color-border-light)'}}>
            <div className="flex items-center gap-3">
                <h2 id={category.id} className="text-2xl font-bold text-[var(--color-text-primary)]">{category.name}</h2>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={isFirst} className="management-button" aria-label={`Move Category ${category.name} up`}><ChevronUpIcon className="w-3.5 h-3.5 text-blue-500"/></Button>
                    <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={isLast} className="management-button" aria-label={`Move Category ${category.name} down`}><ChevronDownIcon className="w-3.5 h-3.5 text-blue-500"/></Button>
                    <Button variant="ghost" size="sm" onClick={() => onEditCategory(category)} className="management-button" aria-label={`Edit Category ${category.name}`}><PencilIcon className="w-3.5 h-3.5 text-blue-500"/></Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteCategory(category.id)} className="management-button text-red-500 hover:bg-red-500/10 hover:text-red-500" aria-label={`Delete Category ${category.name}`}><TrashIcon className="w-3.5 h-3.5"/></Button>
                </div>
            </div>
            <Button size="sm" onClick={() => onAddProduct(category.id)}>Add Product</Button>
        </div>
        {category.products.map((product, idx) =>
            <ProductRenderer
                key={product.id}
                product={product}
                onEdit={() => onEditProduct(product, category.id)}
                onDelete={() => onDeleteProduct(product.id)}
                onMoveUp={() => onMoveProduct(product.id, 'up')}
                onMoveDown={() => onMoveProduct(product.id, 'down')}
                isFirst={idx === 0}
                isLast={idx === category.products.length - 1}
            />
        )}
    </div>
);

interface ProductGuideRendererProps {
    guide: ProductGuide;
    setProductGuides: React.Dispatch<React.SetStateAction<ProductGuide[]>>;
}

const ProductGuideRenderer: React.FC<ProductGuideRendererProps> = ({ guide, setProductGuides }) => {
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
    const [productFormData, setProductFormData] = useState<Omit<Product, 'id'>>(EMPTY_PRODUCT);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
    const [categoryName, setCategoryName] = useState('');

    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [guideTitle, setGuideTitle] = useState(guide.longTitle);

    const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
    const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);

    // --- Product Handlers ---
    const handleOpenAddProductModal = (categoryId: string) => {
        setEditingProduct(null);
        setProductFormData(EMPTY_PRODUCT);
        setTargetCategoryId(categoryId);
        setIsProductModalOpen(true);
    };

    const handleOpenEditProductModal = (product: Product, categoryId: string) => {
        setEditingProduct(product);
        setProductFormData({ name: product.name, summary: product.summary, details: product.details });
        setTargetCategoryId(categoryId);
        setIsProductModalOpen(true);
    };

    const handleCloseProductModal = () => {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        setTargetCategoryId(null);
        setProductFormData(EMPTY_PRODUCT);
    };

    const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProductFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProduct = () => {
        if (!targetCategoryId || !productFormData.name) return;

        setProductGuides(prevGuides => {
            return prevGuides.map(g => {
                if (g.id !== guide.id) return g;

                const newCategories = g.categories.map(cat => {
                    if (cat.id !== targetCategoryId) return cat;

                    let newProducts;
                    if (editingProduct) {
                        newProducts = cat.products.map(p =>
                            p.id === editingProduct.id ? { ...p, ...productFormData } : p
                        );
                    } else {
                        const newProduct: Product = {
                            id: `prod-${Date.now()}`,
                            ...productFormData
                        };
                        newProducts = [...cat.products, newProduct];
                    }
                    return { ...cat, products: newProducts };
                });
                return { ...g, categories: newCategories };
            });
        });

        handleCloseProductModal();
    };

    const handleDeleteProductAction = () => {
        if (!productToDeleteId) return;

        setProductGuides(prevGuides => prevGuides.map(g => {
            if (g.id !== guide.id) return g;

            const newCategories = g.categories.map(cat => ({
                ...cat,
                products: cat.products.filter(p => p.id !== productToDeleteId)
            }));

            return { ...g, categories: newCategories };
        }));
        setProductToDeleteId(null);
    };

    const handleMoveProduct = (productId: string, direction: 'up' | 'down') => {
        setProductGuides(prevGuides => prevGuides.map(g => {
            if (g.id !== guide.id) return g;

            const newCategories = g.categories.map(cat => {
                const index = cat.products.findIndex(p => p.id === productId);
                if (index === -1) return cat;

                const newProducts = [...cat.products];
                if (direction === 'up' && index > 0) {
                    [newProducts[index], newProducts[index - 1]] = [newProducts[index - 1], newProducts[index]];
                } else if (direction === 'down' && index < newProducts.length - 1) {
                    [newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]];
                }
                return { ...cat, products: newProducts };
            });

            return { ...g, categories: newCategories };
        }));
    };

    // --- Category Handlers ---
    const handleOpenAddCategoryModal = () => {
        setEditingCategory(null);
        setCategoryName('');
        setIsCategoryModalOpen(true);
    };

    const handleOpenEditCategoryModal = (category: ProductCategory) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setIsCategoryModalOpen(true);
    };

    const handleCloseCategoryModal = () => {
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        setCategoryName('');
    };

    const handleSaveCategory = () => {
        if (!categoryName) return;

        setProductGuides(prevGuides => prevGuides.map(g => {
            if (g.id !== guide.id) return g;

            let newCategories;
            if (editingCategory) {
                newCategories = g.categories.map(cat =>
                    cat.id === editingCategory.id ? { ...cat, name: categoryName } : cat
                );
            } else {
                const newCategory: ProductCategory = {
                    id: `cat-${Date.now()}`,
                    name: categoryName,
                    products: []
                };
                newCategories = [...g.categories, newCategory];
            }
            return { ...g, categories: newCategories };
        }));

        handleCloseCategoryModal();
    };

    const handleDeleteCategoryAction = () => {
        if (!categoryToDeleteId) return;

        setProductGuides(prevGuides => prevGuides.map(g => {
            if (g.id !== guide.id) return g;
            return { ...g, categories: g.categories.filter(cat => cat.id !== categoryToDeleteId) };
        }));
        setCategoryToDeleteId(null);
    };

    const handleMoveCategory = (categoryId: string, direction: 'up' | 'down') => {
        setProductGuides(prevGuides => prevGuides.map(g => {
            if (g.id !== guide.id) return g;

            const index = g.categories.findIndex(cat => cat.id === categoryId);
            if (index === -1) return g;

            const newCategories = [...g.categories];
            if (direction === 'up' && index > 0) {
                [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]];
            } else if (direction === 'down' && index < newCategories.length - 1) {
                [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
            }

            return { ...g, categories: newCategories };
        }));
    };

    // --- Guide Handlers ---
    const handleOpenGuideModal = () => {
        setGuideTitle(guide.longTitle);
        setIsGuideModalOpen(true);
    };

    const handleCloseGuideModal = () => {
        setIsGuideModalOpen(false);
    };

    const handleSaveGuide = () => {
        if (!guideTitle) return;

        setProductGuides(prevGuides => prevGuides.map(g => {
            if (g.id !== guide.id) return g;
            return { ...g, longTitle: guideTitle };
        }));

        handleCloseGuideModal();
    };

    return (
    <>
        <div className="flex-1 overflow-auto p-6 md:p-10 scroll-smooth">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4 group">
                        <h1 id={guide.id} className="text-4xl font-bold text-[var(--color-text-primary)] leading-tight">{guide.longTitle}</h1>
                        <Button variant="ghost" size="sm" onClick={handleOpenGuideModal} className="management-button" aria-label="Edit Guide Title"><PencilIcon className="w-5 h-5 text-blue-500"/></Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleOpenAddCategoryModal}>Add Category</Button>
                </div>
                <hr className="my-8" style={{borderColor: 'var(--color-border-light)'}} />
                {guide.categories.map((category, idx) => (
                    <ProductCategoryRenderer
                        key={category.id}
                        category={category}
                        onAddProduct={handleOpenAddProductModal}
                        onEditProduct={handleOpenEditProductModal}
                        onDeleteProduct={setProductToDeleteId}
                        onEditCategory={handleOpenEditCategoryModal}
                        onDeleteCategory={setCategoryToDeleteId}
                        onMoveUp={() => handleMoveCategory(category.id, 'up')}
                        onMoveDown={() => handleMoveCategory(category.id, 'down')}
                        onMoveProduct={handleMoveProduct}
                        isFirst={idx === 0}
                        isLast={idx === guide.categories.length - 1}
                    />
                ))}
            </div>
        </div>

        {/* Product Modal */}
        <Modal
            isOpen={isProductModalOpen}
            onClose={handleCloseProductModal}
            title={editingProduct ? 'Edit Product' : 'Add New Product'}
            footer={
                <>
                    <Button variant="ghost" onClick={handleCloseProductModal}>Cancel</Button>
                    <Button onClick={handleSaveProduct} disabled={!productFormData.name}>Save Product</Button>
                </>
            }
        >
            <div className="space-y-4">
                <Input
                    label="Product Name"
                    id="prod-name"
                    name="name"
                    value={productFormData.name}
                    onChange={handleProductFormChange}
                    placeholder="e.g., Online Platform"
                    required
                />
                <Textarea
                    label="Summary"
                    id="prod-summary"
                    name="summary"
                    value={productFormData.summary}
                    onChange={handleProductFormChange}
                    rows={3}
                    placeholder="A brief, one-sentence summary of the product."
                />
                <Textarea
                    label="Details (HTML supported)"
                    id="prod-details"
                    name="details"
                    value={productFormData.details}
                    onChange={handleProductFormChange}
                    rows={10}
                    placeholder="Use HTML for formatting, e.g., <p>, <ul>, <li>, <b>"
                />
            </div>
        </Modal>

        {/* Category Modal */}
        <Modal
            isOpen={isCategoryModalOpen}
            onClose={handleCloseCategoryModal}
            title={editingCategory ? 'Edit Category' : 'Add New Category'}
            footer={
                <>
                    <Button variant="ghost" onClick={handleCloseCategoryModal}>Cancel</Button>
                    <Button onClick={handleSaveCategory} disabled={!categoryName}>Save Category</Button>
                </>
            }
        >
            <Input
                label="Category Name"
                id="cat-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Checking, Savings, etc."
                required
            />
        </Modal>

        {/* Guide Modal */}
        <Modal
            isOpen={isGuideModalOpen}
            onClose={handleCloseGuideModal}
            title="Edit Guide Title"
            footer={
                <>
                    <Button variant="ghost" onClick={handleCloseGuideModal}>Cancel</Button>
                    <Button onClick={handleSaveGuide} disabled={!guideTitle}>Save Title</Button>
                </>
            }
        >
            <Input
                label="Guide Title"
                id="guide-title"
                value={guideTitle}
                onChange={(e) => setGuideTitle(e.target.value)}
                placeholder="e.g., Product Guide: Treasury Management Solutions"
                required
            />
        </Modal>

        {/* Delete Product Confirmation */}
        <Modal
            isOpen={!!productToDeleteId}
            onClose={() => setProductToDeleteId(null)}
            title="Delete Product?"
            footer={
                <>
                    <Button variant="ghost" onClick={() => setProductToDeleteId(null)}>Cancel</Button>
                    <Button onClick={handleDeleteProductAction} className="bg-red-600 hover:bg-red-700 text-white border-none">Delete Product</Button>
                </>
            }
        >
            <p className="text-sm text-[var(--color-text-secondary)]">Are you sure you want to delete this product? This action cannot be undone.</p>
        </Modal>

        {/* Delete Category Confirmation */}
        <Modal
            isOpen={!!categoryToDeleteId}
            onClose={() => setCategoryToDeleteId(null)}
            title="Delete Category?"
            footer={
                <>
                    <Button variant="ghost" onClick={() => setCategoryToDeleteId(null)}>Cancel</Button>
                    <Button onClick={handleDeleteCategoryAction} className="bg-red-600 hover:bg-red-700 text-white border-none">Delete Category</Button>
                </>
            }
        >
            <p className="text-sm text-[var(--color-text-secondary)]">Are you sure you want to delete this category and all its products? This action cannot be undone.</p>
        </Modal>

        <style>{`
            .prose p { margin-bottom: 0.5rem; }
            .prose ul { list-style: disc; padding-left: 20px; }
            .prose b { color: var(--color-text-primary); }
            .management-button {
                opacity: 0.3;
                transition: opacity 0.2s;
            }
            .management-button:hover {
                opacity: 1 !important;
            }
            .group:hover .management-button {
                opacity: 1;
            }
        `}</style>
    </>
    );
};

export default ProductGuideRenderer;