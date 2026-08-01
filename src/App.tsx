import { useState, useEffect, useMemo, type FormEvent } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, where, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import FloralDecor from './components/FloralDecor'
import './App.css'

interface ProductData {
  id: string;
  image: string;
  name: string;
  link: string;
  store: string;
  category: string;
  price: string;
  role?: string;
}

interface CategoryData {
  id: string;
  name: string;
}

type Page = 'products' | 'categories' | 'featured'
type ProductFormMode = 'none' | 'add' | 'edit'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [page, setPage] = useState<Page>('products')

  const [products, setProducts] = useState<ProductData[]>([])
  const [categories, setCategories] = useState<CategoryData[]>([])

  const [productFormMode, setProductFormMode] = useState<ProductFormMode>('none')
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null)

  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [store, setStore] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  const [imageSource, setImageSource] = useState<'url' | 'upload'>('upload')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [categoryName, setCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setCheckingAuth(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return

    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductData))
        setProducts(list)
      },
      (err) => {
        console.error('ERRO FIRESTORE PRODUTOS:', err)
      }
    )

    const unsubscribeCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryData))
        setCategories(list)
      },
      (err) => {
        console.error('ERRO FIRESTORE CATEGORIAS:', err)
      }
    )

    return () => {
      unsubscribeProducts()
      unsubscribeCategories()
    }
  }, [user])

  const normalProducts = useMemo(() => products.filter((p) => p.role !== 'destaque'), [products])
  const featuredProducts = useMemo(() => products.filter((p) => p.role === 'destaque'), [products])

  function filterProductList(list: ProductData[]) {
    return list.filter((p) => {
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.store.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = !filterCategory || p.category === filterCategory
      const priceNum = parseFloat(p.price?.replace(/[^0-9.,]/g, '').replace(',', '.') || '0')
      const min = filterPriceMin ? parseFloat(filterPriceMin.replace(',', '.')) : 0
      const max = filterPriceMax ? parseFloat(filterPriceMax.replace(',', '.')) : Infinity
      const matchPrice = (!filterPriceMin || priceNum >= min) && (!filterPriceMax || priceNum <= max)
      return matchSearch && matchCategory && matchPrice
    })
  }

  const filteredNormal = useMemo(() => filterProductList(normalProducts), [normalProducts, searchQuery, filterCategory, filterPriceMin, filterPriceMax])
  const filteredFeatured = useMemo(() => filterProductList(featuredProducts), [featuredProducts, searchQuery, filterCategory, filterPriceMin, filterPriceMax])

  const currentFiltered = page === 'featured' ? filteredFeatured : filteredNormal
  const totalPages = Math.ceil(currentFiltered.length / ITEMS_PER_PAGE)
  const safePage = Math.min(currentPage, Math.max(1, totalPages || 1))
  const paginatedProducts = currentFiltered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  )

  async function loadProducts() {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const list: ProductData[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductData))
      setProducts(list)
    } catch (err) {
      console.error('Erro ao carregar produtos (ordenado), tentando fallback:', err)
      try {
        const fallback = query(collection(db, 'products'))
        const snap = await getDocs(fallback)
        const list: ProductData[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductData))
        setProducts(list)
      } catch (err2) {
        console.error('Erro ao carregar produtos (fallback):', err2)
      }
    }
  }

  async function loadCategories() {
    try {
      const q = query(collection(db, 'categories'), orderBy('name'))
      const snap = await getDocs(q)
      const list: CategoryData[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoryData))
      setCategories(list)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoginError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setLoginError('Email ou senha inválidos.')
    }
  }

  async function handleLogout() {
    await signOut(auth)
  }

  function resetProductForm() {
    setImage('')
    setName('')
    setLink('')
    setStore('')
    setCategory('')
    setPrice('')
    setImageSource('upload')
    setUploadFile(null)
    setEditingProduct(null)
    setProductFormMode('none')
    setSuccess('')
    setSaveError('')
  }

  function openAddProduct() {
    resetProductForm()
    setProductFormMode('add')
  }

  function openEditProduct(p: ProductData) {
    setImage(p.image)
    setName(p.name)
    setLink(p.link)
    setStore(p.store)
    setCategory(p.category)
    setPrice(p.price)
    setImageSource('upload')
    setUploadFile(null)
    setEditingProduct(p)
    setProductFormMode('edit')
    setSuccess('')
    setSaveError('')
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          let w = img.width, h = img.height
          const maxDim = 600
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round(h * maxDim / w); w = maxDim }
            else { w = Math.round(w * maxDim / h); h = maxDim }
          }
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.onerror = () => reject(new Error('Erro ao processar a imagem'))
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'))
      reader.readAsDataURL(file)
    })
  }

  async function handleSubmitProduct(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setSaveError('')
    try {
      let finalImage = image
      if (imageSource === 'upload' && uploadFile) {
        finalImage = await fileToBase64(uploadFile)
      } else if (imageSource === 'url' && !image) {
        setSaveError('Informe a URL da imagem ou selecione Upload.')
        setSaving(false)
        return
      }
      const role = page === 'featured' ? 'destaque' : 'normal'
      const data = { image: finalImage, name, link, store, category, price, role, createdAt: Date.now() }
      if (productFormMode === 'add') {
        const label = role === 'destaque' ? 'Destaque' : 'Produto'
        await addDoc(collection(db, 'products'), data)
        setSuccess(`${label} cadastrado com sucesso!`)
      } else if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data)
        setSuccess('Produto atualizado com sucesso!')
      }
      resetProductForm()
      await loadProducts()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    try {
      await deleteDoc(doc(db, 'products', id))
      await loadProducts()
    } catch { /* ok */ }
  }

  function resetCategoryForm() {
    setCategoryName('')
    setEditingCategory(null)
    setSavingCategory(false)
  }

  function openEditCategory(c: CategoryData) {
    setCategoryName(c.name)
    setEditingCategory(c)
  }

  async function handleSubmitCategory(e: FormEvent) {
    e.preventDefault()
    setSavingCategory(true)
    try {
      if (editingCategory) {
        const oldName = editingCategory.name
        await updateDoc(doc(db, 'categories', editingCategory.id), { name: categoryName })
        if (oldName !== categoryName) {
          const q = query(collection(db, 'products'), where('category', '==', oldName))
          const snap = await getDocs(q)
          const updates = snap.docs.map((d) => updateDoc(doc(db, 'products', d.id), { category: categoryName }))
          await Promise.all(updates)
        }
      } else {
        await addDoc(collection(db, 'categories'), { name: categoryName })
      }
      resetCategoryForm()
      await loadCategories()
      await loadProducts()
    } catch { /* ok */ } finally {
      setSavingCategory(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    try {
      await deleteDoc(doc(db, 'categories', id))
      await loadCategories()
    } catch { /* ok */ }
  }

  function cancelProductForm() {
    resetProductForm()
  }

  function cancelCategoryEdit() {
    resetCategoryForm()
  }

  if (checkingAuth) {
    return <div className="loading-container"><p>Carregando...</p></div>
  }

  if (!user) {
    return (
      <div className="login-page">
        <FloralDecor variant={1} className="floral-login floral-login-left" />
        <FloralDecor variant={2} className="floral-login floral-login-right" />
        <div className="login-card">
          <h1>Estoque</h1>
          <p className="login-subtitle">Faça login para continuar</p>
          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
            {loginError && <p className="error-message">{loginError}</p>}
            <button type="submit" className="btn-primary">Entrar</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <FloralDecor variant={3} className="floral-dashboard" />
      <header className="app-header">
        <div className="header-left">
          <h1>Estoque</h1>
          <nav className="app-nav">
            <button className={`nav-btn ${page === 'products' ? 'active' : ''}`} onClick={() => { setPage('products'); resetProductForm(); }}>Produtos</button>
            <button className={`nav-btn ${page === 'featured' ? 'active' : ''}`} onClick={() => { setPage('featured'); resetProductForm(); }}>Destaques</button>
            <button className={`nav-btn ${page === 'categories' ? 'active' : ''}`} onClick={() => { setPage('categories'); resetProductForm(); }}>Categorias</button>
          </nav>
        </div>
        <div className="header-right">
          <span className="user-email">{user.email}</span>
          <button onClick={handleLogout} className="btn-logout">Sair</button>
        </div>
      </header>

      <main>
        {page === 'products' && (
          <>
            <div className="page-header">
              <h2>Produtos</h2>
              {productFormMode === 'none' && (
                <button className="btn-primary" onClick={openAddProduct}>+ Novo Produto</button>
              )}
            </div>

            {productFormMode !== 'none' && (
              <div className="form-card">
                <h2>{productFormMode === 'add' ? 'Novo Produto' : 'Editar Produto'}</h2>
                <form onSubmit={handleSubmitProduct} className="product-form">
                  <label>Imagem</label>
                  <div className="image-source-tabs">
                    <button type="button" className={`image-source-tab ${imageSource === 'upload' ? 'active' : ''}`} onClick={() => setImageSource('upload')}>Upload</button>
                    <button type="button" className={`image-source-tab ${imageSource === 'url' ? 'active' : ''}`} onClick={() => setImageSource('url')}>URL</button>
                  </div>

                  {imageSource === 'url' ? (
                    <input id="p-image" type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
                  ) : (
                    <div className="upload-area">
                      <input id="p-image-upload" type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setUploadFile(file)
                        if (file) setImage(URL.createObjectURL(file))
                      }} />
                      {uploadFile && <span className="upload-file-name">{uploadFile.name}</span>}
                    </div>
                  )}

                  {(image || uploadFile) && (
                    <div className="image-preview">
                      <img src={image} alt="Preview" />
                    </div>
                  )}

                  <label htmlFor="p-name">Nome do Produto</label>
                  <input id="p-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" required />

                  <label htmlFor="p-link">Link do Produto</label>
                  <input id="p-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://shopee.com.br/produto" required />

                  <label htmlFor="p-store">Loja Disponível</label>
                  <input id="p-store" type="text" value={store} onChange={(e) => setStore(e.target.value)} placeholder="Shopee, Mercado Livre..." required />

                  <label htmlFor="p-category">Categoria</label>
                  <div className="category-input-group">
                    <input id="p-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Quarto, Brinquedo..." list="category-suggestions" required />
                    <datalist id="category-suggestions">
                      {categories.map((c) => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>

                  <label htmlFor="p-price">Preço</label>
                  <input id="p-price" type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="R$ 39,90" />

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Salvando...' : (productFormMode === 'add' ? 'Cadastrar' : 'Salvar Alterações')}
                    </button>
                    <button type="button" className="btn-secondary" onClick={cancelProductForm}>Cancelar</button>
                  </div>
                  {success && <p className="success-message">{success}</p>}
                  {saveError && <p className="error-message">{saveError}</p>}
                </form>
              </div>
            )}

            {productFormMode === 'none' && (
              <div className="search-filters-bar">
                <div className="search-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="text" placeholder="Pesquisar por nome ou loja..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} />
                </div>
                <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1) }}>
                  <option value="">Todas categorias</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <div className="price-range">
                  <input type="text" placeholder="Preço min" value={filterPriceMin} onChange={(e) => { setFilterPriceMin(e.target.value); setCurrentPage(1) }} />
                  <span>—</span>
                  <input type="text" placeholder="Preço max" value={filterPriceMax} onChange={(e) => { setFilterPriceMax(e.target.value); setCurrentPage(1) }} />
                </div>
                {(searchQuery || filterCategory || filterPriceMin || filterPriceMax) && (
                  <button className="btn-clear-filters" onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterPriceMin(''); setFilterPriceMax(''); setCurrentPage(1) }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    Limpar
                  </button>
                )}
              </div>
            )}

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Imagem</th>
                      <th>Nome</th>
                      <th>Loja</th>
                      <th>Categoria</th>
                      <th>Preço</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalProducts.length === 0 ? (
                      <tr><td colSpan={6} className="empty-row">Nenhum produto cadastrado.</td></tr>
                    ) : filteredNormal.length === 0 ? (
                      <tr><td colSpan={6} className="empty-row">Nenhum produto encontrado com os filtros atuais.</td></tr>
                    ) : paginatedProducts.map((p) => (
                      <tr key={p.id}>
                        <td data-label="Imagem"><img src={p.image} alt="" className="table-thumb" /></td>
                        <td data-label="Nome" className="td-name">{p.name}</td>
                        <td data-label="Loja">{p.store}</td>
                        <td data-label="Categoria"><span className="badge-category">{p.category}</span></td>
                        <td data-label="Preço" className="td-price">{p.price || '-'}</td>
                        <td data-label="Ações">
                          <div className="action-btns">
                            <button className="btn-sm btn-edit" onClick={() => openEditProduct(p)}>Editar</button>
                            <button className="btn-sm btn-delete" onClick={() => handleDeleteProduct(p.id)}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-label="Página anterior"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="pagination-info">{currentPage} de {totalPages}</span>
                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Próxima página"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              )}
          </>
        )}

        {page === 'categories' && (
          <>
            <div className="page-header">
              <h2>Categorias</h2>
            </div>

            <div className="form-card form-card-sm">
              <h2>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <form onSubmit={handleSubmitCategory} className="inline-form">
                <input type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Nome da categoria" required />
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={savingCategory || !categoryName}>
                    {editingCategory ? 'Salvar' : 'Adicionar'}
                  </button>
                  {editingCategory && (
                    <button type="button" className="btn-secondary" onClick={cancelCategoryEdit}>Cancelar</button>
                  )}
                </div>
              </form>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Nome</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr><td colSpan={2} className="empty-row">Nenhuma categoria cadastrada.</td></tr>
                  ) : categories.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-sm btn-edit" onClick={() => openEditCategory(c)}>Editar</button>
                          <button className="btn-sm btn-delete" onClick={() => handleDeleteCategory(c.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {page === 'featured' && (
          <>
            <div className="page-header">
              <h2>Destaques</h2>
              {productFormMode === 'none' && (
                <button className="btn-primary" onClick={openAddProduct}>+ Novo Destaque</button>
              )}
            </div>

            {productFormMode !== 'none' && (
              <div className="form-card">
                <h2>{productFormMode === 'add' ? 'Novo Destaque' : 'Editar Destaque'}</h2>
                <form onSubmit={handleSubmitProduct} className="product-form">
                  <label>Imagem</label>
                  <div className="image-source-tabs">
                    <button type="button" className={`image-source-tab ${imageSource === 'upload' ? 'active' : ''}`} onClick={() => setImageSource('upload')}>Upload</button>
                    <button type="button" className={`image-source-tab ${imageSource === 'url' ? 'active' : ''}`} onClick={() => setImageSource('url')}>URL</button>
                  </div>

                  {imageSource === 'url' ? (
                    <input id="p-image" type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
                  ) : (
                    <div className="upload-area">
                      <input id="p-image-upload" type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setUploadFile(file)
                        if (file) setImage(URL.createObjectURL(file))
                      }} />
                      {uploadFile && <span className="upload-file-name">{uploadFile.name}</span>}
                    </div>
                  )}

                  {(image || uploadFile) && (
                    <div className="image-preview">
                      <img src={image} alt="Preview" />
                    </div>
                  )}

                  <label htmlFor="p-name">Nome do Produto</label>
                  <input id="p-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" required />

                  <label htmlFor="p-link">Link do Produto</label>
                  <input id="p-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://shopee.com.br/produto" required />

                  <label htmlFor="p-store">Loja Disponível</label>
                  <input id="p-store" type="text" value={store} onChange={(e) => setStore(e.target.value)} placeholder="Shopee, Mercado Livre..." required />

                  <label htmlFor="p-category">Categoria</label>
                  <div className="category-input-group">
                    <input id="p-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Quarto, Brinquedo..." list="category-suggestions" required />
                    <datalist id="category-suggestions">
                      {categories.map((c) => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>

                  <label htmlFor="p-price">Preço</label>
                  <input id="p-price" type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="R$ 39,90" />

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Salvando...' : (productFormMode === 'add' ? 'Cadastrar' : 'Salvar Alterações')}
                    </button>
                    <button type="button" className="btn-secondary" onClick={cancelProductForm}>Cancelar</button>
                  </div>
                  {success && <p className="success-message">{success}</p>}
                  {saveError && <p className="error-message">{saveError}</p>}
                </form>
              </div>
            )}

            {productFormMode === 'none' && (
              <>
                <div className="search-filters-bar">
                  <div className="search-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Pesquisar por nome ou loja..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} />
                  </div>
                  <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1) }}>
                    <option value="">Todas categorias</option>
                    {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <div className="price-range">
                    <input type="text" placeholder="Preço min" value={filterPriceMin} onChange={(e) => { setFilterPriceMin(e.target.value); setCurrentPage(1) }} />
                    <span>—</span>
                    <input type="text" placeholder="Preço max" value={filterPriceMax} onChange={(e) => { setFilterPriceMax(e.target.value); setCurrentPage(1) }} />
                  </div>
                  {(searchQuery || filterCategory || filterPriceMin || filterPriceMax) && (
                    <button className="btn-clear-filters" onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterPriceMin(''); setFilterPriceMax(''); setCurrentPage(1) }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      Limpar
                    </button>
                  )}
                </div>

                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Imagem</th>
                        <th>Nome</th>
                        <th>Loja</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {featuredProducts.length === 0 ? (
                        <tr><td colSpan={6} className="empty-row">Nenhum destaque cadastrado.</td></tr>
                      ) : filteredFeatured.length === 0 ? (
                        <tr><td colSpan={6} className="empty-row">Nenhum destaque encontrado com os filtros atuais.</td></tr>
                      ) : paginatedProducts.map((p) => (
                        <tr key={p.id}>
                          <td data-label="Imagem"><img src={p.image} alt="" className="table-thumb" /></td>
                          <td data-label="Nome" className="td-name">{p.name}</td>
                          <td data-label="Loja">{p.store}</td>
                          <td data-label="Categoria"><span className="badge-category">{p.category}</span></td>
                          <td data-label="Preço" className="td-price">{p.price || '-'}</td>
                          <td data-label="Ações">
                            <div className="action-btns">
                              <button className="btn-sm btn-edit" onClick={() => openEditProduct(p)}>Editar</button>
                              <button className="btn-sm btn-delete" onClick={() => handleDeleteProduct(p.id)}>Excluir</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      aria-label="Página anterior"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <span className="pagination-info">{currentPage} de {totalPages}</span>
                    <button
                      className="pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Próxima página"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
