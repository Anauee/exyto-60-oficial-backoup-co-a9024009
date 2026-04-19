
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Recado, Movimento, RecadoSection, MovimentoSection } from '@/api/entities';
import CardItem from './CardItem';
import CardModal from './CardModal';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Columns, Trash2, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDeleteModal from '../shared/ConfirmDeleteModal';

const Entities = {
  Recado: { card: Recado, section: RecadoSection },
  Movimento: { card: Movimento, section: MovimentoSection },
};

const getLayoutClasses = (layoutType) => {
  switch (layoutType) {
    case '100':
      return 'grid-cols-1';
    case '50':
      return 'grid-cols-1 md:grid-cols-2';
    case '33':
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    default:
      return 'grid-cols-1';
  }
};

const getLayoutNumber = (layoutType) => {
  switch (layoutType) {
    case '100':
      return '1';
    case '50':
      return '2';
    case '33':
      return '3';
    default:
      return '1';
  }
};

export default function CardBoard({ entityType, empresaId }) {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  const { card: CardEntity, section: SectionEntity } = Entities[entityType];

  const loadData = useCallback(async () => {
    if (!empresaId || !CardEntity || !SectionEntity) return;
    setIsLoading(true);
    try {
      const [sectionsData, cardsData] = await Promise.all([
        SectionEntity.filter({ empresa_id: empresaId }, 'order'),
        CardEntity.filter({ empresa_id: empresaId })
      ]);

      const sectionsWithCards = sectionsData.map(section => ({
        ...section,
        cards: cardsData
          .filter(card => card.section_id === section.id)
          .sort((a, b) => a.order - b.order)
      }));

      setSections(sectionsWithCards);
    } catch (error) {
      console.error(`Erro ao carregar dados para ${entityType}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, CardEntity, SectionEntity, entityType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;

    if (type === 'SECTION') {
      // Movendo seções inteiras
      const newSections = [...sections];
      const [movedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, movedSection);

      setSections(newSections);

      // Atualizar a ordem das seções no banco
      const updates = newSections.map((section, index) => 
        SectionEntity.update(section.id, { order: index })
      );
      await Promise.all(updates);
    } else {
      // Movendo cards (lógica existente)
      const sourceSectionId = source.droppableId;
      const destSectionId = destination.droppableId;

      const newSections = [...sections];
      const sourceSection = newSections.find(s => s.id === sourceSectionId);
      const destSection = newSections.find(s => s.id === destSectionId);

      if (!sourceSection || !destSection) return;

      if (sourceSectionId === destSectionId) {
        // Reordenando dentro da mesma seção
        const newCards = Array.from(sourceSection.cards);
        const [reorderedItem] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, reorderedItem);

        sourceSection.cards = newCards;
        setSections(newSections);

        const updates = newCards.map((card, index) => 
          CardEntity.update(card.id, { order: index })
        );
        await Promise.all(updates);
      } else {
        // Movendo entre seções diferentes
        const sourceCards = Array.from(sourceSection.cards);
        const destCards = Array.from(destSection.cards);
        const [movedItem] = sourceCards.splice(source.index, 1);
        
        destCards.splice(destination.index, 0, movedItem);
        
        sourceSection.cards = sourceCards;
        destSection.cards = destCards;

        setSections(newSections);

        // Atualizar o card movido
        const updateMovedCardPromise = CardEntity.update(draggableId, { section_id: destSectionId, order: destination.index });

        // Atualizar a ordem dos cards na seção de origem
        const sourceUpdates = sourceCards.map((card, index) =>
          CardEntity.update(card.id, { order: index })
        );
        
        // Atualizar a ordem dos cards na seção de destino
        const destUpdates = destCards.map((card, index) =>
          CardEntity.update(card.id, { order: index })
        );
        
        await Promise.all([updateMovedCardPromise, ...sourceUpdates, ...destUpdates]);
      }
    }
  };
  
  const handleAddSection = async (layoutType) => {
    try {
      await SectionEntity.create({
        layout_type: layoutType,
        order: sections.length,
        empresa_id: empresaId,
      });
      loadData();
    } catch (error) {
      console.error("Erro ao adicionar seção:", error);
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      // Excluir todos os cards da seção primeiro
      const section = sections.find(s => s.id === sectionToDelete);
      if (section && section.cards.length > 0) {
        const deletePromises = section.cards.map(card => CardEntity.delete(card.id));
        await Promise.all(deletePromises);
      }
      // Excluir a seção
      await SectionEntity.delete(sectionToDelete);
      setSectionToDelete(null);
      setShowDeleteSectionModal(false);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir seção:", error);
    }
  };

  const handleSaveCard = async (formData, cardId = null, sectionId = null) => {
    try {
      if (cardId) {
        await CardEntity.update(cardId, formData);
      } else {
        const section = sections.find(s => s.id === sectionId);
        const newOrder = section ? section.cards.length : 0;
        await CardEntity.create({ ...formData, empresa_id: empresaId, section_id: sectionId, order: newOrder });
      }
      setShowCardModal(false);
      setSelectedCard(null);
      setActiveSectionId(null);
      loadData();
    } catch (error) {
      console.error(`Erro ao salvar card de ${entityType}:`, error);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await CardEntity.delete(cardId);
      setShowCardModal(false);
      setSelectedCard(null);
      loadData();
    } catch (error) {
      console.error(`Erro ao excluir card de ${entityType}:`, error);
    }
  };

  const openCardModal = (card = null, sectionId) => {
    setSelectedCard(card);
    setActiveSectionId(sectionId);
    setShowCardModal(true);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-48 ml-auto"></div>
        <div className="h-64 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Seção de Layout
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-2xl border-border/40 shadow-2xl backdrop-blur-xl bg-card/80 p-2">
            <DropdownMenuItem onClick={() => handleAddSection('100')} className="rounded-xl py-3 cursor-pointer">
              <Columns className="w-4 h-4 mr-3 text-primary" /> 
              <span className="font-semibold">Layout de 1 Card (100%)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddSection('50')} className="rounded-xl py-3 cursor-pointer">
              <Columns className="w-4 h-4 mr-3 text-primary" /> 
              <span className="font-semibold">Layout de 2 Cards (50%)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddSection('33')} className="rounded-xl py-3 cursor-pointer">
              <Columns className="w-4 h-4 mr-3 text-primary" /> 
              <span className="font-semibold">Layout de 3 Cards (33%)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections" type="SECTION">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-8"
            >
              {sections.map((section, sectionIndex) => (
                <Draggable key={section.id} draggableId={`section-${section.id}`} index={sectionIndex} type="SECTION">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-md border border-border/40 relative group transition-all duration-300 ${
                        snapshot.isDragging ? 'shadow-2xl scale-[1.02] bg-card/60 z-50' : 'shadow-xl'
                      }`}
                    >
                      {/* Grip handle para arrastar seção */}
                      <div 
                        {...provided.dragHandleProps}
                        className="absolute top-8 left-8 text-muted-foreground hover:text-primary cursor-grab p-2.5 bg-background/50 rounded-xl shadow-sm border border-border/40 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        title="Arrastar seção"
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="flex justify-end items-center mb-8">
                        <div className='flex gap-3'>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openCardModal(null, section.id)}
                            className="h-10 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-bold"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Card (x{getLayoutNumber(section.layout_type)})
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setSectionToDelete(section.id); setShowDeleteSectionModal(true); }}
                            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Droppable droppableId={section.id} type="CARD">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`grid ${getLayoutClasses(section.layout_type)} gap-8 min-h-[120px]`}
                          >
                            {section.cards.map((card, index) => (
                              <Draggable key={card.id} draggableId={card.id} index={index} type="CARD">
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`transition-transform duration-200 ${snapshot.isDragging ? 'z-50 scale-105' : ''}`}
                                  >
                                    <CardItem item={card} onEdit={() => openCardModal(card, section.id)} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {sections.length === 0 && !isLoading && (
        <div className="text-center py-32 border-2 border-dashed border-border/60 rounded-[3rem] bg-card/20 backdrop-blur-sm transition-all hover:bg-card/30">
          <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-primary/10">
            <Layers className="w-12 h-12 text-primary/40" />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-4">Nenhuma seção adicionada</h2>
          <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-medium">
            Comece adicionando a primeira seção de layout para organizar seus cards de {entityType.toLowerCase()}s.
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-10 font-bold shadow-2xl shadow-primary/20 transition-all active:scale-95">
                <Plus className="w-6 h-6 mr-3" />
                Criar Primeira Seção
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-2xl border-border/40 shadow-2xl backdrop-blur-xl bg-card/80 p-2">
              <DropdownMenuItem onClick={() => handleAddSection('100')} className="rounded-xl py-3 cursor-pointer">
                <Columns className="w-4 h-4 mr-3 text-primary" /> 
                <span className="font-semibold">Layout de 1 Card (100%)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddSection('50')} className="rounded-xl py-3 cursor-pointer">
                <Columns className="w-4 h-4 mr-3 text-primary" /> 
                <span className="font-semibold">Layout de 2 Cards (50%)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddSection('33')} className="rounded-xl py-3 cursor-pointer">
                <Columns className="w-4 h-4 mr-3 text-primary" /> 
                <span className="font-semibold">Layout de 3 Cards (33%)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <CardModal
        isOpen={showCardModal}
        onClose={() => { setShowCardModal(false); setSelectedCard(null); setActiveSectionId(null); }}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
        item={selectedCard}
        entityType={entityType}
        sectionId={activeSectionId}
      />
      
      <ConfirmDeleteModal
        isOpen={showDeleteSectionModal}
        onClose={() => setShowDeleteSectionModal(false)}
        onConfirm={handleDeleteSection}
        title="Excluir Seção"
        message="Tem certeza que deseja excluir esta seção? Todos os cards contidos nela também serão excluídos. Esta ação não pode ser desfeita."
      />
    </>
  );
}
