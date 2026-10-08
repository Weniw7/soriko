import type { Metadata } from 'next';
import './engine.css';
import '../../components/commerce/admin.css';
import '../../components/commerce/sourcing.css';
export const metadata:Metadata={title:'Soriko Commerce | Equipo',robots:{index:false,follow:false}};
export default function AdminLayout({children}:{children:React.ReactNode}){return children;}
