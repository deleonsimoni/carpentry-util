import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { StatusConfigService, StatusConfig } from '../../shared/services/status-config.service';

@Component({
  selector: 'app-status-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbDropdownModule, DragDropModule],
  templateUrl: './status-management.component.html',
  styleUrls: ['./status-management.component.scss']
})
export class StatusManagementComponent implements OnInit {
  statusConfigs: StatusConfig[] = [];
  isLoading = false;
  showModal = false;
  editingStatus: StatusConfig | null = null;
  statusForm: FormGroup;

  availableRoles = [
    { key: 'manager', label: 'Manager' },
    { key: 'carpenter', label: 'Carpinteiro' },
    { key: 'supervisor', label: 'Supervisor' },
    { key: 'delivery', label: 'Entregador' }
  ];

  availableColors = [
    '#dc3545', '#fd7e14', '#ffc107', '#20c997',
    '#17a2b8', '#6f42c1', '#e83e8c', '#28a745',
    '#6c757d', '#007bff', '#17c671', '#f39c12'
  ];

  availableIcons = [
    'fas fa-plus-circle', 'fas fa-ruler', 'fas fa-eye',
    'fas fa-shipping-fast', 'fas fa-truck', 'fas fa-cut',
    'fas fa-hammer', 'fas fa-check-circle', 'fas fa-clock',
    'fas fa-exclamation-triangle', 'fas fa-cog', 'fas fa-star'
  ];

  constructor(
    private statusConfigService: StatusConfigService,
    private formBuilder: FormBuilder
  ) {
    this.statusForm = this.formBuilder.group({
      statusId: ['', [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      color: ['#6c757d', [Validators.required]],
      icon: ['fas fa-circle', [Validators.required]],
      isActive: [true],
      allowedRoles: [[], [Validators.required]],
      canTransitionTo: [[]],
      order: [0, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadStatusConfigs();
  }

  loadStatusConfigs(): void {
    this.isLoading = true;
    this.statusConfigService.getAllStatusConfigs().subscribe({
      next: (response) => {
        if (response.success) {
          this.statusConfigs = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar configurações:', error);
        this.isLoading = false;
      }
    });
  }

  openCreateModal(): void {
    this.editingStatus = null;
    this.statusForm.reset({
      statusId: this.getNextStatusId(),
      name: '',
      description: '',
      color: '#6c757d',
      icon: 'fas fa-circle',
      isActive: true,
      allowedRoles: [],
      canTransitionTo: [],
      order: this.statusConfigs.length + 1
    });
    this.showModal = true;
  }

  openEditModal(status: StatusConfig): void {
    this.editingStatus = status;
    this.statusForm.patchValue({
      statusId: status.statusId,
      name: status.name,
      description: status.description,
      color: status.color,
      icon: status.icon,
      isActive: status.isActive,
      allowedRoles: status.allowedRoles,
      canTransitionTo: status.canTransitionTo,
      order: status.order
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingStatus = null;
    this.statusForm.reset();
  }

  onSubmit(): void {
    if (this.statusForm.valid) {
      const formData = this.statusForm.value;

      if (this.editingStatus) {
        this.updateStatus(this.editingStatus._id!, formData);
      } else {
        this.createStatus(formData);
      }
    }
  }

  createStatus(statusData: StatusConfig): void {
    // Check if statusId already exists and shift if needed
    const existingStatus = this.statusConfigs.find(s => s.statusId === statusData.statusId);

    if (existingStatus) {
      // Ask user if they want to insert and shift existing IDs
      const confirmShift = confirm(
        `Já existe um status com ID ${statusData.statusId}. ` +
        `Deseja inserir aqui e empurrar os outros IDs para frente? ` +
        `(O status existente será movido para ID ${statusData.statusId + 1})`
      );

      if (confirmShift) {
        this.shiftStatusIdsAndCreate(statusData);
        return;
      } else {
        // Suggest next available ID
        const nextId = this.getNextStatusId();
        const confirmNext = confirm(
          `Deseja criar o status com ID ${nextId} (próximo disponível)?`
        );
        if (confirmNext) {
          statusData.statusId = nextId;
        } else {
          return; // Cancel creation
        }
      }
    }

    this.statusConfigService.createStatusConfig(statusData).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadStatusConfigs();
          this.closeModal();
        }
      },
      error: (error) => {
        console.error('Erro ao criar status:', error);
      }
    });
  }

  updateStatus(id: string, statusData: Partial<StatusConfig>): void {
    this.statusConfigService.updateStatusConfig(id, statusData).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadStatusConfigs();
          this.closeModal();
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar status:', error);
      }
    });
  }

  deleteStatus(status: StatusConfig): void {
    const deleteMessage = `Tem certeza que deseja excluir o status "${status.name}"?\n\n` +
      `⚠️ Atenção: Todos os IDs maiores que ${status.statusId} serão automaticamente ` +
      `reduzidos em 1 para manter a sequência.\n\n` +
      `Esta ação não pode ser desfeita.`;

    if (confirm(deleteMessage)) {
      this.statusConfigService.deleteStatusConfig(status._id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadStatusConfigs();
            console.log(`Status "${status.name}" excluído com sucesso. IDs foram automaticamente reordenados.`);
          }
        },
        error: (error) => {
          console.error('Erro ao excluir status:', error);
        }
      });
    }
  }

  toggleActiveStatus(status: StatusConfig): void {
    const updatedData = { isActive: !status.isActive };

    this.statusConfigService.updateStatusConfig(status._id!, updatedData).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the local array immediately for better UX
          status.isActive = !status.isActive;
          console.log(`Status "${status.name}" ${status.isActive ? 'ativado' : 'desativado'} com sucesso`);
        }
      },
      error: (error) => {
        console.error('Erro ao alterar status:', error);
        // Revert the change if the request fails
        this.loadStatusConfigs();
      }
    });
  }

  toggleRole(role: string): void {
    const currentRoles = this.statusForm.get('allowedRoles')?.value || [];
    const roleIndex = currentRoles.indexOf(role);

    if (roleIndex > -1) {
      currentRoles.splice(roleIndex, 1);
    } else {
      currentRoles.push(role);
    }

    this.statusForm.patchValue({ allowedRoles: currentRoles });
  }

  isRoleSelected(role: string): boolean {
    const roles = this.statusForm.get('allowedRoles')?.value || [];
    return roles.includes(role);
  }

  toggleTransition(statusId: number): void {
    const currentTransitions = this.statusForm.get('canTransitionTo')?.value || [];
    const transitionIndex = currentTransitions.indexOf(statusId);

    if (transitionIndex > -1) {
      currentTransitions.splice(transitionIndex, 1);
    } else {
      currentTransitions.push(statusId);
    }

    this.statusForm.patchValue({ canTransitionTo: currentTransitions });
  }

  isTransitionSelected(statusId: number): boolean {
    const transitions = this.statusForm.get('canTransitionTo')?.value || [];
    return transitions.includes(statusId);
  }

  getNextStatusId(): number {
    if (this.statusConfigs.length === 0) return 1;
    const maxId = Math.max(...this.statusConfigs.map(s => s.statusId));
    return maxId + 1;
  }

  getRoleName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'manager': 'Manager',
      'carpenter': 'Carpinteiro',
      'supervisor': 'Supervisor',
      'delivery': 'Entregador'
    };
    return roleMap[role] || role;
  }

  getTransitionNames(transitions: number[]): string {
    return transitions
      .map(id => this.statusConfigs.find(s => s.statusId === id)?.name || id.toString())
      .join(', ');
  }

  shiftStatusIdsAndCreate(newStatusData: StatusConfig): void {
    // Get all status configs that need to be shifted (ID >= newStatusData.statusId)
    const statusesToShift = this.statusConfigs
      .filter(s => s.statusId >= newStatusData.statusId)
      .sort((a, b) => b.statusId - a.statusId); // Sort descending to avoid conflicts

    let shiftPromises: any[] = [];

    // Shift existing status IDs up by 1
    statusesToShift.forEach(status => {
      const updateData = { statusId: status.statusId + 1 };
      const promise = firstValueFrom(this.statusConfigService.updateStatusConfig(status._id!, updateData));
      shiftPromises.push(promise);
    });

    // Also need to update any transitions that reference the shifted IDs
    this.statusConfigs.forEach(status => {
      const updatedTransitions = status.canTransitionTo.map(transitionId => {
        return transitionId >= newStatusData.statusId ? transitionId + 1 : transitionId;
      });

      if (JSON.stringify(updatedTransitions) !== JSON.stringify(status.canTransitionTo)) {
        const updateData = { canTransitionTo: updatedTransitions };
        const promise = firstValueFrom(this.statusConfigService.updateStatusConfig(status._id!, updateData));
        shiftPromises.push(promise);
      }
    });

    // Execute all shifts, then create the new status
    Promise.all(shiftPromises).then(() => {
      this.statusConfigService.createStatusConfig(newStatusData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadStatusConfigs();
            this.closeModal();
            console.log(`Status criado com ID ${newStatusData.statusId}. IDs existentes foram empurrados para frente.`);
          }
        },
        error: (error) => {
          console.error('Erro ao criar status após shift:', error);
          this.loadStatusConfigs(); // Reload to see current state
        }
      });
    }).catch(error => {
      console.error('Erro ao fazer shift dos IDs:', error);
      this.loadStatusConfigs(); // Reload to see current state
    });
  }

  onStatusDrop(event: CdkDragDrop<StatusConfig[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      // Create a copy of the array to work with
      const reorderedConfigs = [...this.statusConfigs];

      // Move the item in the array
      moveItemInArray(reorderedConfigs, event.previousIndex, event.currentIndex);

      // Create a mapping of old statusId to new statusId
      const statusIdMapping: { [oldId: number]: number } = {};
      this.statusConfigs.forEach((config, index) => {
        const newIndex = reorderedConfigs.findIndex(c => c._id === config._id);
        statusIdMapping[config.statusId] = newIndex + 1;
      });

      // Update the statusId and order for all items to maintain sequence
      const updatePromises: Promise<any>[] = [];

      reorderedConfigs.forEach((config, index) => {
        const newStatusId = index + 1;
        const newOrder = index + 1;

        if (config.statusId !== newStatusId || config.order !== newOrder) {
          const updateData = {
            statusId: newStatusId,
            order: newOrder
          };

          const promise = firstValueFrom(
            this.statusConfigService.updateStatusConfig(config._id!, updateData)
          );
          updatePromises.push(promise);
        }
      });

      // Update transitions based on the mapping
      reorderedConfigs.forEach(config => {
        const updatedTransitions = config.canTransitionTo.map(transitionId => {
          return statusIdMapping[transitionId] || transitionId;
        });

        // Only update if transitions actually changed
        if (JSON.stringify(updatedTransitions.sort()) !== JSON.stringify(config.canTransitionTo.sort())) {
          const updateData = { canTransitionTo: updatedTransitions };
          const promise = firstValueFrom(
            this.statusConfigService.updateStatusConfig(config._id!, updateData)
          );
          updatePromises.push(promise);
        }
      });

      // Execute all updates and then reload
      Promise.all(updatePromises).then(() => {
        this.loadStatusConfigs();
        console.log('Status reordenados com sucesso!');
      }).catch(error => {
        console.error('Erro ao reordenar status:', error);
        this.loadStatusConfigs(); // Reload to restore original state
      });
    }
  }
}