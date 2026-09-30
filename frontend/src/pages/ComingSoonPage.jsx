import { Link } from 'react-router-dom'

export default function ComingSoonPage({ title, useCase }) {
  return (
    <section className="coming-soon">
      <div className="container">
        <div className="icon mb-3"><i className="bi bi-flower2" /></div>
        <h1 className="h2">{title}</h1>
        <p className="text-muted-fw">
          Trang này đang được phát triển{useCase ? ` (use case ${useCase})` : ''}.
        </p>
        <Link to="/" className="btn btn-forest mt-2">Về trang chủ</Link>
      </div>
    </section>
  )
}
