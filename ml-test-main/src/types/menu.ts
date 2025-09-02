export interface Menu {
  menuId: number;
  menuName: string;
  menuNameEn: string;
  menuPrice: number;
  imageUrl: string;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  categoryNameEn: string;
  menus: Menu[];
}

export type MenuResponse = Category[];
