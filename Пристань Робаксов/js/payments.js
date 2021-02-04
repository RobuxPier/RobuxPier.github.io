$(document).ready(function() {
	$('.continuePayments').prop('disabled', true);
	updateEventListeners();
});

$('.nav-btn').on('click', function() {
	if (localStorage.getItem('lastUsername') === null) {
		$('.popup').css('display', 'block');
		$('.popup1').css('display', 'flex');
	} else {
		goLk();
	}
});

$('.closePayments1').on('click', function() {
	$('.popup').css('display', 'none');
	$('.popup1').css('display', 'none');
});

function goLk() {
	const lastUsername = localStorage.getItem('lastUsername'),
		username = lastUsername === null ? $('.popup-content>input').val() : lastUsername;
	$.ajax({
		url: '/app/payments',
		type: 'GET',
		data: {
			username: username
		},
		error: function(xhr, status, error) {
			if ($('.popup').css('display') == 'none') {
				$('.continuePayments').prop('disabled', true);
				$('.popup-content>input').val('');
				$(".usernameQueryResult").hide();
				return;
			}
			$('.usernameQueryResult').html('Что-то пошло не так ;-(. \nКод ошибки: ' + xhr + ' | ' + status + ' | ' + error);
		},
		success: function(json) {
			// if ($('.popup').css('display') == 'none') {
			// 	$('.continuePayments').prop('disabled', true);
			// 	$('.popup-content>input').val('');
			// 	$(".usernameQueryResult").hide();
			// 	return;
			// }
			if (json.status) {
				window.location.href = `/lk?username=${username}`;
			} else {
				$('.popup-error').css('display', 'flex');
				$('.popup-content>input').val('');
				$(".usernameQueryResult").hide();
				localStorage.clear();
			}
		}
	});
}

function retrieveDataFromUsername() {
	$(".usernameQueryResult").html('<div class="lds-ring lds-ring-white"><div></div><div></div><div></div><div></div></div>');
	$(".usernameQueryResult").show(300);
	$('.continuePayments').prop('disabled', true);
	$('.popup-error').css('display', 'none');

	goLk();
}

$('.continuePayments').on('click', function(e) {
	retrieveDataFromUsername();
});

$('.popup-content>input').on('input keyup', function(e) {
	if (this.value) {
		$('.continuePayments').prop('disabled', false);
		if (e.originalEvent.key === 'Enter') {
			retrieveDataFromUsername();
		}
	} else {
		$('.continuePayments').prop('disabled', true);
	}
});

$('.closePayments2').on('click', function() {
	$('.popup').css('display', 'none');
	$('.popup2').css('display', 'none');
});

function updateEventListeners() {
	$('div.payment-action>button').on('click', function() {
		let oid = this.id.split('|')[0];
		let status = this.id.split('|')[1];
		let parent = $(this).parent();

		// $(this).parent().hide(300);
		parent.html('<div class="lds-ring lds-ring-white"><div></div><div></div><div></div><div></div></div>');
		// $(this).parent().show(300);

		$.ajax({
			url: '/app/repeat',
			type: 'GET',
			data: {
				oid: oid,
				status: status
			},
			error: function(xhr, status, error) {
				// $(this).parent().hide(300);
				parent.html(`<button id="${oid}|${status}">Повторить</button>`);
				// $(this).parent().show(300);
				parent.notify(`Серверная ошибка:\n${xhr} | ${status} | ${error}`, 'error');
			},
			success: function(json) {
				if (json.status) {
					// $(this).parent().hide(300);
					parent.html('');
					$.notify('Успешная перевыплата по номеру ' + oid.substr(-10), 'success');
					let content = preparePaymentsTemplate(json.payments);
					$('.popup2-content').html(content);
				} else {
					// $(this).parent().hide(300);
					parent.html(`<button id="${oid}|${status}">Повторить</button>`);
					// $(this).parent().show(300);
					parent.notify(`Что-то пошло не так:\n${json.reason}`, 'warn');
				}
				updateEventListeners();
			}
		})
	})
}

function preparePaymentsTemplate(json) {
	let statuses = [
		'Group not found(maybe stopped)',
		'Error in RobuxShip CODE',
		'Roblox API Error or Proxy',
		'User not in group',
		'Need refund'
	];
	let content = "<div class='payments'>";
	for (let payment of json) {
		content += `<div class='payment'><div class='payment-number'><p>${payment._id['$oid'].substr(-10)}</p></div><div class='payment-bill'><p>R ${payment.robux_amount}</p></div><div class='payment-username'><p>${payment.username}</p></div><div class='payment-status' style="background-color: ${veilStatus(payment.status, 'color')};"><p>${veilStatus(payment.status, 'text')}</p></div><div class='payment-action'>${statuses.includes(payment.status) ? '<button id="' + payment._id['$oid'] + '|' + payment.status + '">Повторить</button>' : ''}</div></div>`;
	}
	content += '</div>';
	return content;
}

function veilStatus(status, type) {
	let errors = [
		'Group not found(maybe stopped)',
		'Error in RobuxShip CODE',
		'Roblox API Error or Proxy',
		'User not in group',
		'Need refund'
	];
	let successes = [
		'Paid full amount',
		'Not full amount'
	];
	if (errors.includes(status)) {
		if (type === 'text') {
			return 'Ошибка';
		} else if (type === 'color') {
			return '#de2450';
		}
	} else if (successes.includes(status)) {
		if (type === 'text') {
			return 'Выдан';
		} else {
			return '#1b881c';
		}
	} else {
		if (type === 'text') {
			return 'Ожидание';
		} else {
			return '#484848';
		}
	}
}
